import { ADULT_SIZE_CHART, CHILD_SIZE_CHART } from "@/lib/types";

type Locale = "en" | "id";

const LABELS: Record<Locale, { toggle: string; adult: string; child: string; footnote: string }> = {
  en: {
    toggle: "View Size Chart",
    adult: "Adult",
    child: "Kids",
    footnote: "Length · Width · Sleeve. Size tolerance ±1–2 cm.",
  },
  id: {
    toggle: "Lihat Size Chart",
    adult: "Dewasa",
    child: "Anak",
    footnote: "Length = Panjang Baju · Width = Lebar Baju · Sleeve = Lengan. Toleransi ukuran 1–2 cm.",
  },
};

export function SizeChartTable({ locale = "en" }: { locale?: Locale }) {
  const t = LABELS[locale];

  return (
    <details className="group mt-4 rounded-xl border border-navy/15 bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-navy">
        {t.toggle}
        <span className="text-orange transition group-open:rotate-45">+</span>
      </summary>
      <div className="space-y-6 border-t border-navy/10 px-4 pb-4 pt-3">
        <div className="overflow-x-auto">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-orange">{t.adult}</p>
          <table className="w-full min-w-[360px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-navy/50">
                <th className="py-1.5 pr-3">Size</th>
                <th className="py-1.5 pr-3">Length</th>
                <th className="py-1.5 pr-3">Width</th>
                <th className="py-1.5">Sleeve</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10">
              {ADULT_SIZE_CHART.map((row) => (
                <tr key={row.size}>
                  <td className="py-1.5 pr-3 font-semibold text-navy">{row.size}</td>
                  <td className="py-1.5 pr-3 text-navy/70">{row.length} cm</td>
                  <td className="py-1.5 pr-3 text-navy/70">{row.width} cm</td>
                  <td className="py-1.5 text-navy/70">{row.sleeve} cm</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-orange">{t.child}</p>
          <table className="w-full min-w-[280px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-navy/50">
                <th className="py-1.5 pr-3">Size</th>
                <th className="py-1.5 pr-3">Length</th>
                <th className="py-1.5">Width</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/10">
              {CHILD_SIZE_CHART.map((row) => (
                <tr key={row.size}>
                  <td className="py-1.5 pr-3 font-semibold text-navy">{row.size}</td>
                  <td className="py-1.5 pr-3 text-navy/70">{row.length} cm</td>
                  <td className="py-1.5 text-navy/70">{row.width} cm</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-navy/50">{t.footnote}</p>
      </div>
    </details>
  );
}
