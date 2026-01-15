type NewRankingFolderFormProps = {
  selectedPath: string;
  onSelectFolder: () => void;
  onBack: () => void;
  onNext: () => void;
};

export function NewRankingFolderForm({
  selectedPath,
  onSelectFolder,
  onBack,
  onNext,
}: NewRankingFolderFormProps) {
  const isNextEnabled = selectedPath.length > 0;

  return (
    <form
      className="flex h-full flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (!isNextEnabled) {
          return;
        }
        onNext();
      }}
    >
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.32em] text-[color:var(--color-muted)]">
        <span>Step 1/3</span>
        <span>フォルダ選択</span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        <div>
          <h2 className="text-2xl font-semibold">フォルダを選択します</h2>
          <p className="mt-2 text-sm text-[color:var(--color-muted)]">
            ランキング対象のフォルダを指定してください。
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center rounded-full border border-[rgba(45,212,191,0.6)] bg-[rgba(45,212,191,0.12)] px-6 py-3 text-sm font-semibold text-[color:var(--color-ink)] transition hover:-translate-y-0.5 hover:border-[rgba(45,212,191,0.9)]"
          type="button"
          onClick={onSelectFolder}
        >
          フォルダを選ぶ
        </button>
        <div className="w-full max-w-lg rounded-2xl border border-[color:var(--color-outline)] bg-[color:var(--color-panel)] px-4 py-3 text-left text-sm text-[color:var(--color-muted)]">
          {selectedPath || "まだフォルダが選択されていません"}
        </div>
      </div>

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
          disabled={!isNextEnabled}
        >
          次へ
        </button>
      </div>
    </form>
  );
}
