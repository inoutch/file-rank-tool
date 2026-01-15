import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Clipboard, File, FileText, Music } from "lucide-react";
import { FilePreview } from "../../components/FilePreview/FilePreview";
import { getFileName } from "../../utilities/getFileName";
import { toFileUrl } from "../../utilities/toFileUrl";

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
  status: "idle" | "sorting" | "done";
};

const pageSize = 30;

export function RankingView() {
  const { rankingId } = useParams<{ rankingId: string }>();
  const navigate = useNavigate();
  const [ranking, setRanking] = useState<RankingRecord | null>(null);
  const [loadStatus, setLoadStatus] = useState<
    "loading" | "missing" | "ready"
  >("loading");
  const [page, setPage] = useState(1);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
    setPage(1);
  }, [rankingId]);

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

  const sortedFiles = useMemo(() => {
    if (!ranking) {
      return [];
    }
    return buildSortedFiles(ranking.files, ranking.matches);
  }, [ranking]);

  const totalPages = Math.max(1, Math.ceil(sortedFiles.length / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const pageStart = (clampedPage - 1) * pageSize;
  const pageItems = sortedFiles.slice(pageStart, pageStart + pageSize);

  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }
    const timer = window.setTimeout(() => {
      setToastMessage(null);
    }, 2400);
    return () => {
      window.clearTimeout(timer);
    };
  }, [toastMessage]);

  useEffect(() => {
    if (pageItems.length === 0) {
      setSelectedFileId(null);
      return;
    }
    const hasSelected = pageItems.some((item) => item.id === selectedFileId);
    if (!hasSelected) {
      setSelectedFileId(pageItems[0].id);
    }
  }, [pageItems, selectedFileId]);

  const selectedFile = useMemo(() => {
    if (!selectedFileId) {
      return null;
    }
    return sortedFiles.find((item) => item.id === selectedFileId) ?? null;
  }, [selectedFileId, sortedFiles]);

  const handleCopyPath = async (
    event: MouseEvent<HTMLButtonElement>,
    filePath: string
  ) => {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(filePath);
      setToastMessage("フルパスをコピーしました");
    } catch {
      setToastMessage("コピーに失敗しました");
    }
  };

  return (
    <div className="relative h-screen overflow-hidden bg-[color:var(--color-bg)] text-[color:var(--color-ink)]">
      <div className="mx-auto flex h-full max-w-6xl flex-col gap-4 px-6 pb-8 pt-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">ランキング</h1>
            <p className="mt-2 text-sm text-[color:var(--color-muted)]">
              {ranking?.name ?? "-"}
            </p>
          </div>
          <button
            className="rounded-full border border-[color:var(--color-outline)] px-4 py-2 text-xs font-semibold text-[color:var(--color-muted)] transition hover:border-[rgba(148,163,184,0.6)] hover:text-[color:var(--color-ink)]"
            type="button"
            onClick={() => navigate("/")}
          >
            一覧へ戻る
          </button>
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
            {loadStatus === "ready" && ranking ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[color:var(--color-muted)]">
                  <div>
                    {sortedFiles.length.toLocaleString()} 件のランキング
                  </div>
                  <div>
                    ページ {clampedPage} / {totalPages}
                  </div>
                </div>
                <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-4">
                  <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-[color:var(--color-outline)] bg-[color:var(--color-panel)]">
                    <div className="flex items-center justify-between border-b border-[color:var(--color-outline)] px-4 py-3 text-xs uppercase tracking-[0.32em] text-[color:var(--color-muted)]">
                      <span>Preview List</span>
                      <span>{pageItems.length} items</span>
                    </div>
                    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-4">
                      {pageItems.map((file, index) => {
                        const rankNumber = pageStart + index + 1;
                        const isSelected = file.id === selectedFileId;
                        const category = resolveCategory(
                          file.path,
                          extensionCategoryMap
                        );
                        return (
                          <div
                            key={file.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedFileId(file.id)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setSelectedFileId(file.id);
                              }
                            }}
                            className={`flex items-center gap-4 rounded-xl border px-4 py-3 text-left transition ${
                              isSelected
                                ? "border-[rgba(45,212,191,0.6)] bg-[rgba(45,212,191,0.12)]"
                                : "border-[color:var(--color-outline)] bg-[rgba(15,23,42,0.6)] hover:border-[rgba(45,212,191,0.5)]"
                            }`}
                          >
                            <div className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-xl border border-[color:var(--color-outline)] bg-[rgba(15,23,42,0.5)]">
                              <span className="text-[10px] uppercase tracking-[0.24em] text-[color:var(--color-muted)]">
                                Rank
                              </span>
                              <span className="text-sm font-semibold">
                                {rankNumber}
                              </span>
                            </div>
                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[color:var(--color-outline)] bg-[rgba(15,23,42,0.5)]">
                              {category === "image" ? (
                                <img
                                  className="h-full w-full object-cover"
                                  src={toFileUrl(file.path)}
                                  alt=""
                                />
                              ) : null}
                              {category === "video" ? (
                                <video
                                  className="h-full w-full object-cover"
                                  muted
                                  playsInline
                                  preload="metadata"
                                >
                                  <source src={toFileUrl(file.path)} />
                                </video>
                              ) : null}
                              {category === "audio" ? (
                                <Music className="h-5 w-5 text-[color:var(--color-muted)]" />
                              ) : null}
                              {category === "text" ? (
                                <FileText className="h-5 w-5 text-[color:var(--color-muted)]" />
                              ) : null}
                              {category === "other" ? (
                                <File className="h-5 w-5 text-[color:var(--color-muted)]" />
                              ) : null}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-semibold text-[color:var(--color-ink)]">
                                {getFileName(file.path)}
                              </div>
                              <div className="mt-1 text-xs text-[color:var(--color-muted)]">
                                プレビュー
                              </div>
                            </div>
                            <button
                              className="rounded-full border border-[color:var(--color-outline)] p-2 text-[color:var(--color-muted)] transition hover:border-[rgba(59,130,246,0.6)] hover:text-[rgba(191,219,254,0.95)]"
                              type="button"
                              aria-label="フルパスをコピー"
                              title="フルパスをコピー"
                              onClick={(event) => handleCopyPath(event, file.path)}
                            >
                              <Clipboard className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-[color:var(--color-outline)] bg-[color:var(--color-panel)] p-4">
                    {selectedFile ? (
                      <FilePreview
                        filePath={selectedFile.path}
                        category={resolveCategory(
                          selectedFile.path,
                          extensionCategoryMap
                        )}
                        label="Viewer"
                      />
                    ) : (
                      <div className="flex flex-1 items-center justify-center text-sm text-[color:var(--color-muted)]">
                        プレビューする項目を選択してください。
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    className="rounded-full border border-[color:var(--color-outline)] px-4 py-2 text-xs font-semibold text-[color:var(--color-muted)] transition hover:border-[rgba(148,163,184,0.6)] hover:text-[color:var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-40"
                    type="button"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={clampedPage <= 1}
                  >
                    前へ
                  </button>
                  <div className="text-xs text-[color:var(--color-muted)]">
                    {pageSize} 件ずつ表示
                  </div>
                  <button
                    className="rounded-full border border-[color:var(--color-outline)] px-4 py-2 text-xs font-semibold text-[color:var(--color-muted)] transition hover:border-[rgba(148,163,184,0.6)] hover:text-[color:var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-40"
                    type="button"
                    onClick={() =>
                      setPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={clampedPage >= totalPages}
                  >
                    次へ
                  </button>
                </div>
              </>
            ) : null}
          </section>
        </main>
      </div>
      {toastMessage ? (
        <div className="toast-fade pointer-events-none fixed right-6 top-6 rounded-full border border-[color:var(--color-outline)] bg-[color:var(--color-surface)] px-4 py-2 text-xs text-[color:var(--color-ink)] shadow-[var(--shadow-soft)]">
          {toastMessage}
        </div>
      ) : null}
    </div>
  );
}

function buildSortedFiles(
  files: RankingFile[],
  matches: RankingMatch[]
): RankingFile[] {
  const matchLookup = new Map<string, string>();
  for (const match of matches) {
    if (!match.winnerId) {
      continue;
    }
    matchLookup.set(buildMatchKey(match.leftId, match.rightId), match.winnerId);
  }
  let state = createSortState(files);
  state = applyRecordedMatches(state, matchLookup);
  if (state.status !== "done") {
    return [...state.sortedFiles, ...files.filter((item) => !state.sortedFiles.includes(item))];
  }
  return state.sortedFiles;
}

function createSortState(files: RankingFile[]): SortState {
  return advanceSortState({
    operationStack: [{ type: "sort", items: files }],
    currentPartition: null,
    sortedFiles: [],
    status: "idle",
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

function applyChoice(state: SortState, winner: "left" | "right"): SortState {
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

  if (nextIndex < partition.items.length) {
    return {
      ...state,
      currentPartition: {
        ...partition,
        left,
        right,
        index: nextIndex,
      },
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
  });
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
