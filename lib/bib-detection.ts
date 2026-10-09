import "server-only";
import { supabaseServer } from "./supabase-server";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.8-flash";

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
};

type BibTag = { number: string; category: "2.5K" | "5K" | null };

const MAX_RETRIES = 3;
const RETRY_STATUS_CODES = new Set([429, 500, 503]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// The printed race bib only shows a 3-digit number next to a small category
// badge ("2.5K" or "5K") — the real BIB number stored in the DB is that
// category's leading digit (2 or 5) plus the 3 printed digits (e.g. badge
// "5K" + printed "008" -> BIB 5008). So Gemini needs to read both the
// number AND the category badge, not just the number, or we can't
// reconstruct the real BIB number.
async function detectBibTagsInImage(imageBuffer: Buffer): Promise<BibTag[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const requestBody = JSON.stringify({
    contents: [
      {
        parts: [
          {
            text: "This is a photo from a charity fun run / community race. Every runner wears a printed race bib on their chest: a small category badge reading either \"2.5K\" or \"5K\", next to a bold 3-digit number (e.g. \"008\", \"035\"). Find every runner's bib in the photo and report the 3-digit number plus its category badge. Ignore any other numbers in the scene (sponsor banners, timestamps, street signs, shirt brands, etc). If a number or the category badge is partially visible, blurry, or at an angle, do your best to read it. If you can read the number but genuinely cannot tell the category badge, still report the number with category null. If you can't confidently read the number at all, leave that bib out entirely.",
          },
          { inline_data: { mime_type: "image/jpeg", data: imageBuffer.toString("base64") } },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      // This is a straightforward read-the-image task, not something that
      // benefits from extended reasoning — disabling thinking keeps
      // cost/latency down across what could be thousands of photos.
      thinkingConfig: { thinkingBudget: 0 },
      responseSchema: {
        type: "object",
        properties: {
          bibs: {
            type: "array",
            items: {
              type: "object",
              properties: {
                number: { type: "string" },
                category: { type: "string", enum: ["2.5K", "5K", "unknown"] },
              },
              required: ["number", "category"],
            },
          },
        },
        required: ["bibs"],
      },
    },
  });

  let res: Response | undefined;
  let lastError: unknown;
  // Gemini's flash models occasionally return a transient 503 ("high
  // demand") or 429 (rate limit), or the request just times out at the
  // network level — retrying with backoff clears most of these, which
  // matters a lot when uploading photos by the hundreds.
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: requestBody }
      );
      lastError = undefined;
      if (res.ok || !RETRY_STATUS_CODES.has(res.status) || attempt === MAX_RETRIES) break;
    } catch (err) {
      res = undefined;
      lastError = err;
      if (attempt === MAX_RETRIES) break;
    }
    await sleep(500 * 2 ** attempt);
  }
  if (!res) {
    throw lastError instanceof Error ? lastError : new Error("Gemini API request failed");
  }

  if (!res.ok) {
    throw new Error(`Gemini API error ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return [];

  try {
    const parsed = JSON.parse(text) as {
      bibs?: Array<{ number?: unknown; category?: unknown }>;
    };
    if (!Array.isArray(parsed.bibs)) return [];
    const tags: BibTag[] = [];
    for (const b of parsed.bibs) {
      const number = String(b.number ?? "").replace(/[^0-9]/g, "");
      if (!number) continue;
      const category: BibTag["category"] = b.category === "2.5K" || b.category === "5K" ? b.category : null;
      tags.push({ number, category });
    }
    return tags;
  } catch {
    return [];
  }
}

// Reconstructs real BIB number candidates from a detected (number, category)
// pair. When the category badge wasn't legible, both the 2.5K and 5K
// readings are returned as candidates — matchValidBibNumbers() below then
// only keeps whichever one(s) turn out to be real, issued BIB numbers.
function reconstructCandidates(tag: BibTag): string[] {
  if (tag.number.length === 4) return [tag.number];
  if (tag.number.length === 0 || tag.number.length > 4) return [];

  const suffix = tag.number.padStart(3, "0");
  if (tag.category === "5K") return [`5${suffix}`];
  if (tag.category === "2.5K") return [`2${suffix}`];
  return [`5${suffix}`, `2${suffix}`];
}

// Detects BIB numbers in a race photo and returns only the ones that are
// unambiguous real matches against issued BIB numbers. A candidate that
// matches more than one real BIB (e.g. the category badge wasn't legible
// and both "2034" and "5034" are real, issued numbers) is deliberately
// dropped rather than guessed — tagging the wrong runner's photo is worse
// than leaving one untagged for manual review.
export async function detectBibNumbersInImage(imageBuffer: Buffer): Promise<number[]> {
  const tags = await detectBibTagsInImage(imageBuffer);
  const matched: number[] = [];

  for (const tag of tags) {
    const candidates = reconstructCandidates(tag);
    const validMatches = await matchValidBibNumbers(candidates);
    if (validMatches.length === 1) {
      matched.push(validMatches[0]);
    }
    // validMatches.length === 0 -> no real match, drop it.
    // validMatches.length > 1 -> ambiguous (both 2xxx and 5xxx exist), drop it.
  }

  return Array.from(new Set(matched));
}

// Cross-references candidate BIB numbers against real, issued BIB numbers —
// filters out anything Gemini got wrong or that isn't actually someone's
// BIB, regardless of how confident the model sounded.
export async function matchValidBibNumbers(candidates: string[]): Promise<number[]> {
  const nums = Array.from(
    new Set(candidates.map((c) => Number(c)).filter((n) => Number.isInteger(n)))
  );
  if (nums.length === 0) return [];

  const { data, error } = await supabaseServer
    .from("participants")
    .select("bib_number")
    .in("bib_number", nums);

  if (error || !data) return [];
  return data.map((p) => p.bib_number as number);
}
