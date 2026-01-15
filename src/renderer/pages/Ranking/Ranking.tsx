import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Heart } from "lucide-react";
import { FilePreview } from "../../components/FilePreview/FilePreview";

type SortOperation =
  | { type: "sort"; items: RankingFile[] }
  | { type: "append"; item: RankingFile };

type PartitionState = {
  pivot: RankingFile;
  items: RankingFile[];
  index: number;
  left: RankingFile[];
  right: RankingFile[];
};

type SortState = {
  operationStack: SortOperation[];
  currentPartition: PartitionState | null;
  sortedFiles: RankingFile[];
  comparisonsDone: number;
  status: "idle" | "sorting" | "done";
};

export function Ranking() {
  const { rankingId } = useParams<{ rankingId: string }>();
  const navigate = useNavigate();
  const [ranking, setRanking] = useState<RankingRecord | null>(null);
  const [loadStatus, setLoadStatus] = useState<
    "loading" | "missing" | "ready"
  >("loading");
  const [sortState, setSortState] = useState<SortState>({
    operationStack: [],
    currentPartition: null,
    sortedFiles: [],
    comparisonsDone: 0,
    status: "idle",
  });
  const [estimatedTotal, setEstimatedTotal] = useState(0);
  const [displayPair, setDisplayPair] = useState<{
    key: string;
    isPivotLeft: boolean;
  }>({ key: "", isPivotLeft: true });

  useEffect(() => {
    if (!rankingId) {
      setLoadStatus("missing");
      return;
    }
    setLoadStatus("loading");
    window.fileRank.getRanking(rankingId).then((record) => {
      if (!record) {
        setLoadStatus("missing");
        return;
      }
      setRanking(record);
      setLoadStatus("ready");
    });
  }, [rankingId]);

  useEffect(() => {
    if (!ranking) {
      return;
    }
    setEstimatedTotal(estimateComparisons(ranking.files.length));
    setSortState(createSortState(ranking.files));
  }, [ranking]);

  useEffect(() => {
    if (!ranking) {
      return;
    }
    if (ranking.status === "Complete") {
      return;
    }
    if (sortState.status !== "done") {
      return;
    }
    window.fileRank
      .updateRankingStatus({ rankingId: ranking.id, status: "Complete" })
      .then((updated) => {
        if (updated) {
          setRanking(updated);
        }
      });
  }, [ranking, sortState.status]);

  const matchLookup = useMemo(() => {
    const map = new Map<string, string>();
    if (!ranking) {
      return map;
    }
    for (const match of ranking.matches) {
      if (!match.winnerId) {
        continue;
      }
      const key = buildMatchKey(match.leftId, match.rightId);
      map.set(key, match.winnerId);
    }
    return map;
  }, [ranking]);

  useEffect(() => {
    if (!ranking) {
      return;
    }
    setSortState((prev) => applyRecordedMatches(prev, matchLookup));
  }, [matchLookup, ranking]);

  const extensionCategoryMap = useMemo(() => {
    const map = new Map<string, ScanCategory>();
    if (!ranking) {
      return map;
    }
    for (const item of ranking.extensions) {
      if (!map.has(item.extension)) {
        map.set(item.extension, item.category);
      }
    }
    return map;
  }, [ranking]);

  const currentPartition = sortState.currentPartition;
  const currentCandidate = currentPartition
    ? currentPartition.items[currentPartition.index]
    : null;
  const currentPivot = currentPartition?.pivot ?? null;
  const displayKey =
    currentPivot && currentCandidate
      ? `${currentPivot.id}:${currentCandidate.id}`
      : "";

  const remainingComparisons = Math.max(
    0,
    estimatedTotal - sortState.comparisonsDone
  );
  const progressRate =
    estimatedTotal > 0
      ? Math.min(100, Math.round((sortState.comparisonsDone / estimatedTotal) * 100))
      : 0;

  useEffect(() => {
    if (!currentPivot || !currentCandidate) {
      return;
    }
    if (displayKey && displayKey !== displayPair.key) {
      setDisplayPair({
        key: displayKey,
        isPivotLeft: Math.random() >= 0.5,
      });
    }
  }, [currentCandidate, currentPivot, displayKey, displayPair.key]);

  const handleDecision = useCallback(
    async (side: "left" | "right") => {
    if (!ranking || !currentPartition || !currentCandidate) {
      return;
    }
    const pivotWins =
      side === "left" ? displayPair.isPivotLeft : !displayPair.isPivotLeft;
    const winnerId = pivotWins
      ? currentPartition.pivot.id
      : currentCandidate.id;
    const match: RankingMatch = {
      leftId: currentPartition.pivot.id,
      rightId: currentCandidate.id,
      winnerId,
    };
    setSortState((prev) => applyChoice(prev, pivotWins ? "left" : "right"));
    await window.fileRank.appendMatch({ rankingId: ranking.id, match });
    setRanking((prev) =>
      prev ? { ...prev, matches: [...prev.matches, match] } : prev
    );
    },
    [currentCandidate, currentPartition, displayPair.isPivotLeft, ranking]
  );

  useEffect(() => {
    if (!currentPivot || !currentCandidate) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        handleDecision("left");
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        handleDecision("right");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentCandidate, currentPivot, handleDecision]);

  const showEmpty =
    loadStatus === "ready" && ranking && ranking.files.length < 2;

  return (
    <div className="relative h-screen overflow-hidden bg-[color:var(--color-bg)] text-[color:var(--color-ink)]">
      <div className="mx-auto flex h-full max-w-6xl flex-col gap-4 px-6 pb-8 pt-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">ランク付け</h1>
            <p className="mt-2 text-sm text-[color:var(--color-muted)]">
              {ranking?.name ?? "-"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 text-right">
            <button
              className="rounded-full border border-[rgba(148,163,184,0.5)] bg-[rgba(148,163,184,0.08)] px-4 py-2 text-xs font-semibold text-[color:var(--color-muted)] transition hover:border-[rgba(148,163,184,0.8)] hover:text-[color:var(--color-ink)]"
              type="button"
              onClick={() => navigate("/")}
            >
              中断
            </button>
            <div className="grid gap-1 text-right text-xs text-[color:var(--color-muted)]">
              <div>
                残り推定 {remainingComparisons.toLocaleString()} 比較
              </div>
              <div>
                進捗 {sortState.comparisonsDone.toLocaleString()} /{" "}
                {estimatedTotal.toLocaleString()} ({progressRate}%)
              </div>
            </div>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col">
          <section className="flex min-h-0 flex-1 flex-col gap-4 rounded-[28px] border border-[color:var(--color-outline)] bg-[color:var(--color-surface)] p-4 shadow-[var(--shadow-soft)]">
            {loadStatus === "loading" ? (
              <div className="flex flex-1 items-center justify-center text-sm text-[color:var(--color-muted)]">
                読み込み中...
              </div>
            ) : null}
            {loadStatus === "missing" ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 text-sm text-[color:var(--color-muted)]">
                <p>ランキングが見つかりません。</p>
                <button
                  className="rounded-full border border-[color:var(--color-outline)] px-4 py-2 text-xs"
                  type="button"
                  onClick={() => navigate("/")}
                >
                  一覧へ戻る
                </button>
              </div>
            ) : null}
            {showEmpty ? (
              <div className="flex flex-1 items-center justify-center text-sm text-[color:var(--color-muted)]">
                比較するファイルが足りません。
              </div>
            ) : null}
            {loadStatus === "ready" && ranking && !showEmpty ? (
              <>
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.32em] text-[color:var(--color-muted)]">
                  <span>Comparison</span>
                  <button
                    className="rounded-full border border-[color:var(--color-outline)] px-4 py-1 text-[11px] font-semibold text-[color:var(--color-muted)] transition hover:border-[rgba(148,163,184,0.6)] hover:text-[color:var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-40"
                    type="button"
                    onClick={async () => {
                      if (!ranking) {
                        return;
                      }
                      const updated = await window.fileRank.undoLastMatch(
                        ranking.id
                      );
                      if (updated) {
                        setRanking(updated);
                      }
                    }}
                    disabled={!ranking || ranking.matches.length === 0}
                  >
                    ひとつ戻す
                  </button>
                </div>
                <div className="grid min-h-0 flex-1 grid-cols-2 gap-6">
                  {currentPivot && currentCandidate ? (
                    <>
                      <FilePreview
                        filePath={
                          displayPair.isPivotLeft
                            ? currentPivot.path
                            : currentCandidate.path
                        }
                        category={resolveCategory(
                          displayPair.isPivotLeft
                            ? currentPivot.path
                            : currentCandidate.path,
                          extensionCategoryMap
                        )}
                        label="LEFT"
                      />
                      <FilePreview
                        filePath={
                          displayPair.isPivotLeft
                            ? currentCandidate.path
                            : currentPivot.path
                        }
                        category={resolveCategory(
                          displayPair.isPivotLeft
                            ? currentCandidate.path
                            : currentPivot.path,
                          extensionCategoryMap
                        )}
                        label="RIGHT"
                      />
                    </>
                  ) : (
                    <div className="col-span-full flex flex-1 flex-col items-center justify-center gap-4 text-sm text-[color:var(--color-muted)]">
                      <p>ランク付けが完了しました。</p>
                      <button
                        className="rounded-full border border-[rgba(59,130,246,0.6)] bg-[rgba(59,130,246,0.12)] px-5 py-2 text-xs font-semibold text-[rgba(191,219,254,0.95)] transition hover:border-[rgba(59,130,246,0.9)]"
                        type="button"
                        onClick={() => navigate(`/rank/${ranking.id}/view`)}
                      >
                        ランキングを見る
                      </button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-[rgba(45,212,191,0.5)] bg-[rgba(45,212,191,0.12)] px-6 py-3 text-sm font-semibold text-[color:var(--color-ink)] transition hover:border-[rgba(45,212,191,0.9)] disabled:cursor-not-allowed disabled:opacity-40"
                    type="button"
                    onClick={() => handleDecision("left")}
                    disabled={!currentPivot || !currentCandidate}
                  >
                    <Heart className="h-4 w-4" />
                    左がGOOD
                    <span className="text-[11px] text-[color:var(--color-muted)]">
                      ←
                    </span>
                  </button>
                  <button
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-[rgba(45,212,191,0.5)] bg-[rgba(45,212,191,0.12)] px-6 py-3 text-sm font-semibold text-[color:var(--color-ink)] transition hover:border-[rgba(45,212,191,0.9)] disabled:cursor-not-allowed disabled:opacity-40"
                    type="button"
                    onClick={() => handleDecision("right")}
                    disabled={!currentPivot || !currentCandidate}
                  >
                    <Heart className="h-4 w-4" />
                    右がGOOD
                    <span className="text-[11px] text-[color:var(--color-muted)]">
                      →
                    </span>
                  </button>
                </div>
              </>
            ) : null}
          </section>
        </main>
      </div>
    </div>
  );
}

function createSortState(files: RankingFile[]): SortState {
  return advanceSortState({
    operationStack: [{ type: "sort", items: files }],
    currentPartition: null,
    sortedFiles: [],
    comparisonsDone: 0,
    status: "idle",
  });
}

function applyChoice(
  state: SortState,
  winner: "left" | "right"
): SortState {
  if (!state.currentPartition) {
    return state;
  }
  const partition = state.currentPartition;
  const candidate = partition.items[partition.index];
  const left = [...partition.left];
  const right = [...partition.right];

  if (winner === "left") {
    right.push(candidate);
  } else {
    left.push(candidate);
  }

  const nextIndex = partition.index + 1;
  const comparisonsDone = state.comparisonsDone + 1;

  if (nextIndex < partition.items.length) {
    return {
      ...state,
      currentPartition: {
        ...partition,
        left,
        right,
        index: nextIndex,
      },
      comparisonsDone,
    };
  }

  const operationStack = [...state.operationStack];
  operationStack.push({ type: "sort", items: right });
  operationStack.push({ type: "append", item: partition.pivot });
  operationStack.push({ type: "sort", items: left });

  return advanceSortState({
    ...state,
    operationStack,
    currentPartition: null,
    comparisonsDone,
  });
}

function applyRecordedMatches(
  state: SortState,
  matchLookup: Map<string, string>
): SortState {
  let nextState = state;
  let didApply = false;

  while (nextState.currentPartition) {
    const partition = nextState.currentPartition;
    const candidate = partition.items[partition.index];
    const key = buildMatchKey(partition.pivot.id, candidate.id);
    const winnerId = matchLookup.get(key);
    if (!winnerId) {
      break;
    }
    const winner = winnerId === partition.pivot.id ? "left" : "right";
    nextState = applyChoice(nextState, winner);
    didApply = true;
  }

  return didApply ? nextState : state;
}

function advanceSortState(state: SortState): SortState {
  if (state.currentPartition) {
    return state;
  }

  const operationStack = [...state.operationStack];
  const sortedFiles = [...state.sortedFiles];
  let currentPartition: PartitionState | null = null;
  let status: SortState["status"] = state.status;

  while (!currentPartition) {
    const operation = operationStack.pop();
    if (!operation) {
      status = "done";
      break;
    }
    if (operation.type === "append") {
      sortedFiles.push(operation.item);
      continue;
    }
    if (operation.items.length <= 1) {
      sortedFiles.push(...operation.items);
      continue;
    }
    const [pivot, ...rest] = operation.items;
    currentPartition = {
      pivot,
      items: rest,
      index: 0,
      left: [],
      right: [],
    };
    status = "sorting";
  }

  return {
    ...state,
    operationStack,
    currentPartition,
    sortedFiles,
    status,
  };
}

function estimateComparisons(totalFiles: number): number {
  if (totalFiles <= 1) {
    return 0;
  }
  return Math.max(1, Math.round(totalFiles * Math.log2(totalFiles)));
}

function normalizeExtension(extension: string): string {
  if (!extension) {
    return "拡張子なし";
  }
  return extension.toLowerCase();
}

function resolveCategory(
  filePath: string,
  extensionCategoryMap: Map<string, ScanCategory>
): ScanCategory {
  const match = /(\.[^./\\]+)$/.exec(filePath);
  const extension = normalizeExtension(match ? match[1] : "");
  return extensionCategoryMap.get(extension) ?? "other";
}

function buildMatchKey(leftId: string, rightId: string): string {
  return leftId < rightId ? `${leftId}|${rightId}` : `${rightId}|${leftId}`;
}
