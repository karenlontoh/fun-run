import { NavBar } from "@/app/components/NavBar";
import { Footer } from "@/app/components/Footer";

export default async function VerifyLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <>
      <NavBar />
      <main className="flex-1 bg-cream">
        <div className="mx-auto max-w-sm px-5 py-20">
          <p className="font-display text-sm tracking-[0.3em] text-orange">COMMITTEE ONLY</p>
          <h1 className="font-display mt-2 text-3xl text-navy">Enter Access Code</h1>
          <p className="mt-3 text-sm text-navy/70">
            This page is for race-day committee use only. Enter the shared access code to scan
            and view participant QR codes.
          </p>

          <form method="POST" action="/api/verify-login" className="mt-8 space-y-4">
            <input type="hidden" name="next" value={next ?? "/"} />
            <label className="block">
              <span className="text-sm font-semibold text-navy">Access Code</span>
              <input
                required
                type="password"
                name="code"
                autoFocus
                className="mt-1 w-full rounded-lg border border-navy/20 px-4 py-2.5 focus:border-orange focus:outline-none"
                placeholder="Enter access code"
              />
            </label>
            {error && (
              <p className="rounded-lg bg-orange/10 px-4 py-3 text-sm font-semibold text-orange-dark">
                Incorrect access code. Please try again.
              </p>
            )}
            <button
              type="submit"
              className="font-display w-full rounded-full bg-orange py-3 text-lg tracking-wide text-cream shadow-lg transition hover:bg-orange-dark"
            >
              CONTINUE
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
