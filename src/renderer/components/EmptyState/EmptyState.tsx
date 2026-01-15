type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="h-full flex-1 grid place-items-center rounded-2xl border border-dashed border-[color:var(--color-outline)] bg-[color:var(--color-panel)] px-8 py-14 text-center">
      <h2 className="text-lg font-semibold text-[color:var(--color-ink)]">
        {title}
      </h2>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-[color:var(--color-muted)]">
        {description}
      </p>
    </div>
  );
}
