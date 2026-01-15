import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "../../components/EmptyState/EmptyState";
import { FooterBar } from "../../components/FooterBar/FooterBar";
import { RankingsTable } from "../../components/RankingsTable/RankingsTable";

type Ranking = {
  id: string;
  name: string;
  folderPath: string;
  status: RankingStatus;
};

export function Index() {
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const hasRankings = rankings.length > 0;
  const navigate = useNavigate();

  const loadRankings = useCallback(async () => {
    const items = await window.fileRank.getRankings();
    setRankings(items);
  }, []);

  useEffect(() => {
    loadRankings();
  }, [loadRankings]);

  const tableItems = useMemo(
    () =>
      rankings.map((ranking) => ({
        id: ranking.id,
        name: ranking.name,
        folderPath: ranking.folderPath,
        status: ranking.status,
        updatedAt: ranking.updatedAt,
      })),
    [rankings]
  );

  const handleDeleteRanking = async (rankingId: string) => {
    const shouldDelete = window.confirm(
      "このランキングを削除しますか？この操作は取り消せません。"
    );
    if (!shouldDelete) {
      return;
    }
    await window.fileRank.deleteRanking(rankingId);
    await loadRankings();
  };

  return (
    <div className="relative h-screen overflow-hidden bg-[color:var(--color-bg)] text-[color:var(--color-ink)]">
      <div className="mx-auto flex h-full max-w-6xl flex-col gap-6 px-6 pb-8 pt-8">
        <main className="flex min-h-0 flex-1 flex-col">
          <section className="flex min-h-0 flex-1 flex-col gap-6 rounded-[28px] border border-[color:var(--color-outline)] bg-[color:var(--color-surface)] p-8 shadow-[var(--shadow-soft)]">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">ファイルランキング</h2>
                  <p className="mt-1 text-sm text-[color:var(--color-muted)]">
                    最近作成したランキングの一覧です。
                  </p>
                </div>
                <button
                  className="rounded-full border border-[color:var(--color-outline)] px-3 py-1 text-[11px] font-semibold text-[color:var(--color-muted)] transition hover:border-[rgba(148,163,184,0.6)] hover:text-[color:var(--color-ink)]"
                  type="button"
                  onClick={() => window.fileRank.openRankingsFolder()}
                >
                  保存先を開く
                </button>
              </div>
            </div>

            <div className="flex h-full min-h-0 flex-1 flex-col">
              {hasRankings ? (
                <RankingsTable
                  rankings={tableItems}
                  onStartRanking={(rankingId) => navigate(`/rank/${rankingId}`)}
                  onViewRanking={(rankingId) =>
                    navigate(`/rank/${rankingId}/view`)
                  }
                  onEditRanking={(rankingId) =>
                    navigate(`/rank/${rankingId}/edit`)
                  }
                  onDeleteRanking={handleDeleteRanking}
                />
              ) : (
                <EmptyState
                  title="まだランキングがありません"
                  description="新しいランキングを作成するとここに表示されます。"
                />
              )}
            </div>
          </section>
        </main>

        <FooterBar onCreate={() => navigate("/new")} />
      </div>
    </div>
  );
}
