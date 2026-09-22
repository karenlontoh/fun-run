import { ADULT_SIZE_CHART } from "@/lib/types";

export function SizeChartTable() {
  return (
    <details className="group mt-4 rounded-xl border border-navy/15 bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-navy">
        Lihat Size Chart (Dewasa)
        <span className="text-orange transition group-open:rotate-45">+</span>
      </summary>
      <div className="overflow-x-auto border-t border-navy/10 px-4 pb-4 pt-3">
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
        <p className="mt-2 text-xs text-navy/50">
          Length = Panjang Baju · Width = Lebar Baju · Sleeve = Lengan. Toleransi ukuran 1–2 cm.
        </p>
      </div>
    </details>
  );
}
