type RankingSummary = {
  id: string;
  name: string;
  folderPath: string;
};

type RankingsTableProps = {
  rankings: RankingSummary[];
};

export function RankingsTable({ rankings }: RankingsTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[color:var(--color-outline)] bg-[color:var(--color-panel)]">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-[color:var(--color-surface)] text-[11px] uppercase tracking-[0.28em] text-[color:var(--color-muted)]">
          <tr>
            <th className="px-5 py-3 font-medium">名前</th>
            <th className="px-5 py-3 font-medium">フォルダ</th>
          </tr>
        </thead>
        <tbody>
          {rankings.map((ranking) => (
            <tr
              key={ranking.id}
              className="border-t border-[color:var(--color-outline)] transition hover:bg-[color:var(--color-row-hover)]"
            >
              <td className="px-5 py-3 text-[15px] text-[color:var(--color-ink)]">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--color-accent)] shadow-[0_0_12px_rgba(45,212,191,0.7)]" />
                  <span className="font-medium">{ranking.name}</span>
                </div>
              </td>
              <td className="px-5 py-3 font-mono text-[13px] text-[color:var(--color-muted)]">
                <span className="block max-w-[420px] truncate sm:max-w-none">
                  {ranking.folderPath}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
