type ScanCategory = "image" | "video" | "audio" | "text" | "other";

type ExtensionItem = {
  extension: string;
  count: number;
};

type ScanResult = {
  totalFiles: number;
  categories: Record<ScanCategory, ExtensionItem[]>;
};

type ScanProgress = {
  processed: number;
  total: number;
  currentPath: string;
};

type NewRankingExtensionsFormProps = {
  status: "scanning" | "done" | "canceled";
  progress: ScanProgress;
  result: ScanResult | null;
  selectedExtensions: Record<string, boolean>;
  onToggleExtension: (category: ScanCategory, extension: string) => void;
  onBack: () => void;
  onNext: () => void;
};

const categoryLabels: Record<ScanCategory, string> = {
  image: "画像",
  video: "動画",
  audio: "音声",
  text: "テキスト",
  other: "その他",
};

export function NewRankingExtensionsForm({
  status,
  progress,
  result,
  selectedExtensions,
  onToggleExtension,
  onBack,
  onNext,
}: NewRankingExtensionsFormProps) {
  const percentage =
    progress.total > 0
      ? Math.min(100, Math.round((progress.processed / progress.total) * 100))
      : 0;
  const canProceed =
    status === "done" &&
    Object.values(selectedExtensions).some((isSelected) => isSelected);

  return (
    <form
      className="flex min-h-0 flex-1 flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canProceed) {
          return;
        }
        onNext();
      }}
    >
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.32em] text-[color:var(--color-muted)]">
        <span>Step 2/3</span>
        <span>拡張子選択</span>
      </div>

      {status === "scanning" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <div>
            <h2 className="text-2xl font-semibold">
              フォルダをスキャンしています
            </h2>
            <p className="mt-2 text-sm text-[color:var(--color-muted)]">
              大量のファイルがある場合は少し時間がかかります。
            </p>
          </div>
          <div className="w-full max-w-lg">
            <div className="flex items-center justify-between text-xs text-[color:var(--color-muted)]">
              <span>
                {progress.processed.toLocaleString()} /{" "}
                {progress.total.toLocaleString()}
              </span>
              <span>{percentage}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[color:var(--color-panel)]">
              <div
                className="h-full bg-[linear-gradient(90deg,rgba(45,212,191,0.9),rgba(59,130,246,0.9))] transition-[width]"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="mt-3 truncate text-left text-xs text-[color:var(--color-muted)]">
              {progress.currentPath || "準備中..."}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-auto pr-1">
          {result ? (
            (Object.keys(categoryLabels) as ScanCategory[]).map((category) => {
              const items = result.categories[category] ?? [];
              return (
                <div
                  key={category}
                  className="rounded-2xl border border-[color:var(--color-outline)] bg-[color:var(--color-panel)] p-5"
                >
                  <h3 className="text-sm font-semibold">{categoryLabels[category]}</h3>
                  {items.length === 0 ? (
                    <p className="mt-2 text-xs text-[color:var(--color-muted)]">
                      該当するファイルはありません。
                    </p>
                  ) : (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {items.map((item) => {
                        const key = `${category}:${item.extension}`;
                        return (
                          <label
                            key={key}
                            className="flex items-center gap-3 rounded-xl border border-[color:var(--color-outline)] bg-[rgba(15,23,42,0.6)] px-3 py-2 text-sm text-[color:var(--color-ink)]"
                          >
                            <input
                              className="h-4 w-4 accent-[color:var(--color-accent)]"
                              type="checkbox"
                              checked={selectedExtensions[key] ?? false}
                              onChange={() =>
                                onToggleExtension(category, item.extension)
                              }
                            />
                            <span className="flex-1 truncate">
                              {item.extension}
                            </span>
                            <span className="text-xs text-[color:var(--color-muted)]">
                              {item.count.toLocaleString()}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-[color:var(--color-muted)]">
              スキャン結果がありません。
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          className="inline-flex items-center justify-center rounded-full border border-[color:var(--color-outline)] bg-transparent px-6 py-3 text-sm font-semibold text-[color:var(--color-muted)] transition hover:border-[rgba(148,163,184,0.6)] hover:text-[color:var(--color-ink)]"
          type="button"
          onClick={onBack}
        >
          戻る
        </button>
        <button
          className="inline-flex items-center justify-center rounded-full border border-[rgba(45,212,191,0.5)] bg-[linear-gradient(135deg,rgba(45,212,191,0.25),rgba(15,118,110,0.12))] px-6 py-3 text-sm font-semibold text-[color:var(--color-ink)] shadow-[0_12px_30px_rgba(20,184,166,0.25)] transition hover:-translate-y-0.5 hover:border-[rgba(45,212,191,0.9)] disabled:cursor-not-allowed disabled:border-[color:var(--color-outline)] disabled:bg-[color:var(--color-panel)] disabled:text-[color:var(--color-muted)] disabled:shadow-none disabled:hover:translate-y-0"
          type="submit"
          disabled={!canProceed}
        >
          次へ
        </button>
      </div>
    </form>
  );
}
