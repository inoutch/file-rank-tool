type RankingSummary = {
  id: string;
  name: string;
  folderPath: string;
  status: RankingStatus;
  updatedAt: string;
};

type RankingsTableProps = {
  rankings: RankingSummary[];
  onStartRanking: (rankingId: string) => void;
  onViewRanking: (rankingId: string) => void;
  onDeleteRanking: (rankingId: string) => void;
};

export function RankingsTable({
  rankings,
  onStartRanking,
  onViewRanking,
  onDeleteRanking,
}: RankingsTableProps) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-auto rounded-2xl border border-[color:var(--color-outline)] bg-[color:var(--color-panel)]">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="text-[11px] uppercase tracking-[0.28em] text-[color:var(--color-muted)]">
          <tr>
            <th className="sticky top-0 z-10 bg-[color:var(--color-surface)] px-5 py-3 font-medium">
              名前
            </th>
            <th className="sticky top-0 z-10 bg-[color:var(--color-surface)] px-5 py-3 font-medium">
              フォルダ
            </th>
            <th className="sticky top-0 z-10 bg-[color:var(--color-surface)] px-5 py-3 font-medium">
              更新日
            </th>
            <th className="sticky top-0 z-10 bg-[color:var(--color-surface)] px-5 py-3 text-right font-medium">
              操作
            </th>
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
                  <span
                    className={`h-2.5 w-2.5 rounded-full shadow-[0_0_12px_rgba(45,212,191,0.35)] ${
                      ranking.status === "Complete"
                        ? "bg-[rgba(34,197,94,0.95)]"
                        : "bg-[rgba(234,179,8,0.95)]"
                    }`}
                    title={ranking.status}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{ranking.name}</span>
                    <span className="text-[10px] uppercase tracking-[0.24em] text-[color:var(--color-muted)]">
                      {ranking.status}
                    </span>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3 font-mono text-[13px] text-[color:var(--color-muted)]">
                <span className="block max-w-[420px] truncate sm:max-w-none">
                  {ranking.folderPath}
                </span>
              </td>
              <td className="px-5 py-3 text-xs text-[color:var(--color-muted)]">
                {formatUpdatedAt(ranking.updatedAt)}
              </td>
              <td className="px-5 py-3">
                <div className="flex items-center justify-end gap-2">
                  {ranking.status === "Complete" ? (
                    <button
                      className="rounded-full border border-[rgba(59,130,246,0.6)] bg-[rgba(59,130,246,0.12)] px-4 py-2 text-xs font-semibold text-[rgba(191,219,254,0.95)] transition hover:border-[rgba(59,130,246,0.9)]"
                      type="button"
                      onClick={() => onViewRanking(ranking.id)}
                    >
                      ランキングを見る
                    </button>
                  ) : (
                    <button
                      className="rounded-full border border-[rgba(45,212,191,0.5)] bg-[rgba(45,212,191,0.12)] px-4 py-2 text-xs font-semibold text-[color:var(--color-ink)] transition hover:border-[rgba(45,212,191,0.9)]"
                      type="button"
                      onClick={() => onStartRanking(ranking.id)}
                    >
                      ランク付け
                    </button>
                  )}
                  <button
                    className="rounded-full border border-[rgba(248,113,113,0.6)] bg-[rgba(248,113,113,0.08)] px-4 py-2 text-xs font-semibold text-[rgba(248,113,113,0.9)] transition hover:border-[rgba(248,113,113,0.9)]"
                    type="button"
                    onClick={() => onDeleteRanking(ranking.id)}
                  >
                    削除
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatUpdatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleString("ja-JP", {
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
