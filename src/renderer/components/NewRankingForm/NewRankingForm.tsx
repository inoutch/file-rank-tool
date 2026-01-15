type NewRankingFormProps = {
  themeName: string;
  isNextEnabled: boolean;
  onThemeNameChange: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
};

export function NewRankingForm({
  themeName,
  isNextEnabled,
  onThemeNameChange,
  onBack,
  onNext,
}: NewRankingFormProps) {
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
        <span>テーマ名</span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <div>
          <h2 className="text-2xl font-semibold">テーマの名前を決めます</h2>
          <p className="mt-2 text-sm text-[color:var(--color-muted)]">
            ランキングの軸になるテーマ名を入力してください。
          </p>
        </div>
        <div className="w-full max-w-md">
          <input
            className="mt-3 w-full rounded-2xl border border-[color:var(--color-outline)] bg-[color:var(--color-panel)] px-4 py-3 text-base text-[color:var(--color-ink)] outline-none transition focus:border-[rgba(45,212,191,0.7)] focus:ring-2 focus:ring-[rgba(45,212,191,0.3)]"
            placeholder="例: 2025年のベストアルバム"
            value={themeName}
            onChange={(event) => onThemeNameChange(event.target.value)}
          />
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
          className="inline-flex items-center justify-center rounded-full border border-[rgba(45,212,191,0.5)] bg-[linear-gradient(135deg,rgba(45,212,191,0.25),rgba(15,118,110,0.12))] px-6 py-3 text-sm font-semibold text-[color:var(--color-ink)] shadow-[0_12px_30px_rgba(20,184,166,0.25)] transition hover:-translate-y-0.5 hover:border-[rgba(45,212,191,0.9)] disabled:cursor-not-allowed disabled:border-[rgba(71,85,105,0.6)] disabled:bg-[rgba(15,23,42,0.35)] disabled:text-[rgba(148,163,184,0.5)] disabled:shadow-none disabled:opacity-40 disabled:saturate-0 disabled:[background-image:none] disabled:hover:translate-y-0"
          type="submit"
          disabled={!isNextEnabled}
        >
          次へ
        </button>
      </div>
    </form>
  );
}
