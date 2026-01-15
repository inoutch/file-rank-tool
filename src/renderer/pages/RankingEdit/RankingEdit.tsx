import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export function RankingEdit() {
  const { rankingId } = useParams<{ rankingId: string }>();
  const navigate = useNavigate();
  const [ranking, setRanking] = useState<RankingRecord | null>(null);
  const [loadStatus, setLoadStatus] = useState<
    "loading" | "missing" | "ready"
  >("loading");
  const [name, setName] = useState("");
  const isSaveEnabled = name.trim().length > 0;

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
      setName(record.name);
      setLoadStatus("ready");
    });
  }, [rankingId]);

  const handleSave = async () => {
    if (!rankingId || !isSaveEnabled) {
      return;
    }
    const updated = await window.fileRank.updateRankingTitle({
      rankingId,
      name: name.trim(),
    });
    if (updated) {
      setRanking(updated);
      setName(updated.name);
    }
  };

  const handleReset = async () => {
    if (!rankingId) {
      return;
    }
    const shouldReset = window.confirm(
      "ランク付けデータをリセットしますか？この操作は取り消せません。"
    );
    if (!shouldReset) {
      return;
    }
    const updated = await window.fileRank.resetRankingData(rankingId);
    if (updated) {
      setRanking(updated);
    }
  };

  return (
    <div className="relative h-screen overflow-hidden bg-[color:var(--color-bg)] text-[color:var(--color-ink)]">
      <div className="mx-auto flex h-full max-w-5xl flex-col gap-6 px-6 pb-10 pt-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">ファイルランキング編集</h1>
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
          <section className="flex min-h-0 flex-1 flex-col gap-6 rounded-[28px] border border-[color:var(--color-outline)] bg-[color:var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
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
                <div className="grid gap-3 rounded-2xl border border-[color:var(--color-outline)] bg-[color:var(--color-panel)] p-5">
                  <div className="text-xs uppercase tracking-[0.32em] text-[color:var(--color-muted)]">
                    タイトル
                  </div>
                  <input
                    className="w-full rounded-2xl border border-[color:var(--color-outline)] bg-[rgba(15,23,42,0.6)] px-4 py-3 text-base text-[color:var(--color-ink)] outline-none transition focus:border-[rgba(45,212,191,0.7)] focus:ring-2 focus:ring-[rgba(45,212,191,0.3)]"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                  <div className="text-xs text-[color:var(--color-muted)]">
                    フォルダ: {ranking.folderPath}
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    className="rounded-full border border-[rgba(248,113,113,0.6)] bg-[rgba(248,113,113,0.08)] px-5 py-2 text-xs font-semibold text-[rgba(248,113,113,0.9)] transition hover:border-[rgba(248,113,113,0.9)]"
                    type="button"
                    onClick={handleReset}
                  >
                    ランク付けデータをリセット
                  </button>
                  <button
                    className="rounded-full border border-[rgba(45,212,191,0.5)] bg-[linear-gradient(135deg,rgba(45,212,191,0.25),rgba(15,118,110,0.12))] px-6 py-2 text-xs font-semibold text-[color:var(--color-ink)] shadow-[0_12px_30px_rgba(20,184,166,0.25)] transition hover:-translate-y-0.5 hover:border-[rgba(45,212,191,0.9)] disabled:cursor-not-allowed disabled:border-[color:var(--color-outline)] disabled:bg-[color:var(--color-panel)] disabled:text-[color:var(--color-muted)] disabled:shadow-none disabled:hover:translate-y-0"
                    type="button"
                    onClick={handleSave}
                    disabled={!isSaveEnabled}
                  >
                    保存
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
