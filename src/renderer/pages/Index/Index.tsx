import { useMemo, useState } from "react";
import { EmptyState } from "../../components/EmptyState/EmptyState";
import { FooterBar } from "../../components/FooterBar/FooterBar";
import { RankingsTable } from "../../components/RankingsTable/RankingsTable";

type FileType = "image" | "music" | "video" | "text" | "other";

type Ranking = {
  id: string;
  name: string;
  folderPath: string;
  fileType: FileType;
  isRanked: boolean;
};

const storageKey = "file-rank-tool.rankings";

function loadRankings(): Ranking[] {
  const raw = localStorage.getItem(storageKey);
  if (!raw) {
    return [];
  }
  return JSON.parse(raw) as Ranking[];
}

export function Index() {
  const [rankings] = useState<Ranking[]>(() => loadRankings());
  const hasRankings = rankings.length > 0;

  const tableItems = useMemo(
    () =>
      rankings.map((ranking) => ({
        id: ranking.id,
        name: ranking.name,
        folderPath: ranking.folderPath,
      })),
    [rankings]
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[color:var(--color-bg)] text-[color:var(--color-ink)]">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 pb-10 pt-10">
        <main className="flex min-h-0 flex-1 flex-col">
          <section className="flex min-h-0 flex-1 flex-col gap-6 rounded-[28px] border border-[color:var(--color-outline)] bg-[color:var(--color-surface)] p-8 shadow-[var(--shadow-soft)]">
            <div className="flex h-full flex-1 flex-col gap-4">
              <div>
                <h2 className="text-lg font-semibold">ランキング</h2>
                <p className="mt-1 text-sm text-[color:var(--color-muted)]">
                  最近作成したランキングの一覧です。
                </p>
              </div>
            </div>

            <div className="flex h-full min-h-0 flex-1 flex-col">
              {hasRankings ? (
                <RankingsTable rankings={tableItems} />
              ) : (
                <EmptyState
                  title="まだランキングがありません"
                  description="新しいランキングを作成するとここに表示されます。"
                />
              )}
            </div>
          </section>
        </main>

        <FooterBar onCreate={() => undefined} />
      </div>
    </div>
  );
}
