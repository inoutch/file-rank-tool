import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NewRankingExtensionsForm } from "../../components/NewRankingExtensionsForm/NewRankingExtensionsForm";
import { NewRankingFolderForm } from "../../components/NewRankingFolderForm/NewRankingFolderForm";
import { NewRankingForm } from "../../components/NewRankingForm/NewRankingForm";

type Step = "folder" | "extensions" | "theme";

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

export function NewRanking() {
  const navigate = useNavigate();
  const [themeName, setThemeName] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("");
  const [step, setStep] = useState<Step>("folder");
  const isNextEnabled = themeName.trim().length > 0;
  const [scanStatus, setScanStatus] = useState<"scanning" | "done" | "canceled">(
    "scanning"
  );
  const [scanProgress, setScanProgress] = useState<ScanProgress>({
    processed: 0,
    total: 0,
    currentPath: "",
  });
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [selectedExtensions, setSelectedExtensions] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    if (step !== "extensions") {
      return;
    }

    let isActive = true;
    setScanStatus("scanning");
    setScanProgress({ processed: 0, total: 0, currentPath: "" });
    setScanResult(null);

    const unsubscribe = window.fileRank.onScanProgress((payload) => {
      if (!isActive) {
        return;
      }
      setScanProgress(payload);
    });

    window.fileRank.startScan(selectedFolder).then((result) => {
      if (!isActive) {
        return;
      }
      if (!result) {
        setScanStatus("canceled");
        return;
      }
      setScanResult(result);
      setScanStatus("done");
      setSelectedExtensions(buildDefaultSelection(result));
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [selectedFolder, step]);

  const handleSelectFolder = async () => {
    const selected = await window.fileRank.selectFolder();
    if (!selected) {
      return;
    }
    setSelectedFolder(selected);
  };

  const handleToggleExtension = (category: ScanCategory, extension: string) => {
    const key = `${category}:${extension}`;
    setSelectedExtensions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleBackFromExtensions = () => {
    window.fileRank.cancelScan();
    setStep("folder");
  };

  const handleStartRanking = async () => {
    const selected = toSelectedExtensions(selectedExtensions);
    if (selected.length === 0) {
      return;
    }
    const created = await window.fileRank.createRanking({
      name: themeName.trim(),
      folderPath: selectedFolder,
      selectedExtensions: selected,
    });
    navigate(`/rank/${created.id}`);
  };

  return (
    <div className="relative h-screen overflow-hidden bg-[color:var(--color-bg)] text-[color:var(--color-ink)]">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-36 left-[10%] h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,_rgba(45,212,191,0.22),_transparent_68%)] blur-3xl" />
        <div className="absolute bottom-[-20%] right-[5%] h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,_rgba(59,130,246,0.2),_transparent_70%)] blur-3xl" />
        <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:72px_72px]" />
      </div>

      <div className="mx-auto flex h-full max-w-5xl flex-col px-6 pb-8 pt-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.4em] text-[color:var(--color-muted)]">
              New Ranking
            </p>
            <h1 className="mt-3 text-3xl font-semibold">新規ランキング作成</h1>
          </div>
          <div className="rounded-full border border-[color:var(--color-outline)] bg-[color:var(--color-panel)] px-4 py-2 text-xs uppercase tracking-[0.32em] text-[color:var(--color-muted)]">
            Draft
          </div>
        </header>

        <main className="flex min-h-0 flex-1">
          <section className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col rounded-[28px] border border-[color:var(--color-outline)] bg-[color:var(--color-surface)] p-8 shadow-[var(--shadow-soft)]">
            {step === "folder" ? (
              <NewRankingFolderForm
                selectedPath={selectedFolder}
                onSelectFolder={handleSelectFolder}
                onBack={() => navigate(-1)}
                onNext={() => setStep("extensions")}
              />
            ) : null}
            {step === "extensions" ? (
              <NewRankingExtensionsForm
                status={scanStatus}
                progress={scanProgress}
                result={scanResult}
                selectedExtensions={selectedExtensions}
                onToggleExtension={handleToggleExtension}
                onBack={handleBackFromExtensions}
                onNext={() => setStep("theme")}
              />
            ) : null}
            {step === "theme" ? (
              <NewRankingForm
                themeName={themeName}
                folderPath={selectedFolder}
                isNextEnabled={isNextEnabled}
                onThemeNameChange={setThemeName}
                onBack={() => setStep("extensions")}
                onNext={handleStartRanking}
              />
            ) : null}
          </section>
        </main>
      </div>
    </div>
  );
}

function buildDefaultSelection(result: ScanResult): Record<string, boolean> {
  const selected: Record<string, boolean> = {};
  const categories = Object.keys(result.categories) as ScanCategory[];
  for (const category of categories) {
    for (const item of result.categories[category]) {
      selected[`${category}:${item.extension}`] = true;
    }
  }
  return selected;
}

function toSelectedExtensions(
  selected: Record<string, boolean>
): { category: ScanCategory; extension: string }[] {
  const items: { category: ScanCategory; extension: string }[] = [];
  for (const [key, isSelected] of Object.entries(selected)) {
    if (!isSelected) {
      continue;
    }
    const [category, extension] = key.split(":");
    if (
      category !== "image" &&
      category !== "video" &&
      category !== "audio" &&
      category !== "text" &&
      category !== "other"
    ) {
      continue;
    }
    items.push({ category, extension });
  }
  return items;
}
