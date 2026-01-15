type FooterBarProps = {
  onCreate: () => void;
};

export function FooterBar({ onCreate }: FooterBarProps) {
  return (
    <footer className="rounded-3xl border border-[color:var(--color-outline)] bg-[color:var(--color-surface)] px-6 py-5 shadow-[var(--shadow-soft)]">
      <div className="mx-auto flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-[color:var(--color-muted)]">
            Quick Action
          </p>
          <p className="mt-2 text-sm text-[color:var(--color-subtle)]">
            新しいランキングを追加して整理を始めましょう。
          </p>
        </div>
        <button
          className="group relative inline-flex items-center justify-center overflow-hidden rounded-full border border-[rgba(45,212,191,0.5)] bg-[linear-gradient(135deg,rgba(45,212,191,0.25),rgba(15,118,110,0.12))] px-6 py-3 text-sm font-semibold text-[color:var(--color-ink)] shadow-[0_12px_30px_rgba(20,184,166,0.25)] transition hover:-translate-y-0.5 hover:border-[rgba(45,212,191,0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg)]"
          type="button"
          onClick={onCreate}
        >
          <span className="mr-2 inline-flex h-2 w-2 rounded-full bg-[color:var(--color-accent)] shadow-[0_0_12px_rgba(45,212,191,0.9)]" />
          新しく作成
        </button>
      </div>
    </footer>
  );
}
