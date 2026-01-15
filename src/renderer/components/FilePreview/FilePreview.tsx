import { useEffect, useMemo, useState } from "react";
import { File, FileText, Music } from "lucide-react";
import { getFileName } from "../../utilities/getFileName";
import { toFileUrl } from "../../utilities/toFileUrl";

type FileCategory = "image" | "video" | "audio" | "text" | "other";

type FilePreviewProps = {
  filePath: string;
  category: FileCategory;
  label: string;
};

const categoryLabel: Record<FileCategory, string> = {
  image: "Image",
  video: "Video",
  audio: "Audio",
  text: "Text",
  other: "Other",
};

export function FilePreview({ filePath, category, label }: FilePreviewProps) {
  const [textPreview, setTextPreview] = useState<string | null>(null);
  const [isLoadingText, setIsLoadingText] = useState(false);
  const fileName = useMemo(() => getFileName(filePath), [filePath]);
  const fileUrl = useMemo(() => toFileUrl(filePath), [filePath]);

  useEffect(() => {
    if (category !== "text" && category !== "other") {
      setTextPreview(null);
      return;
    }
    let isActive = true;
    setIsLoadingText(true);
    window.fileRank.readTextPreview(filePath).then((text) => {
      if (!isActive) {
        return;
      }
      setTextPreview(text);
      setIsLoadingText(false);
    });
    return () => {
      isActive = false;
    };
  }, [category, filePath]);

  const displayCategory = categoryLabel[category];
  const showText = (category === "text" || category === "other") && textPreview;
  const showTextPlaceholder =
    (category === "text" || category === "other") &&
    !isLoadingText &&
    textPreview === "";

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[color:var(--color-outline)] bg-[color:var(--color-panel)]">
      <div className="flex items-center justify-between border-b border-[color:var(--color-outline)] px-4 py-3 text-xs uppercase tracking-[0.32em] text-[color:var(--color-muted)]">
        <span className="truncate">{label}</span>
        <span>{displayCategory}</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
        <div
          className="text-sm font-semibold text-[color:var(--color-ink)]"
          title={filePath}
        >
          {fileName}
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl border border-[color:var(--color-outline)] bg-[rgba(15,23,42,0.6)] p-4">
          {category === "image" ? (
            <img
              className="h-full w-full object-contain"
              src={fileUrl}
              alt={fileName}
            />
          ) : null}
          {category === "video" ? (
            <video className="h-full w-full" controls preload="metadata">
              <source src={fileUrl} />
            </video>
          ) : null}
          {category === "audio" ? (
            <div className="flex w-full flex-col items-center gap-4">
              <Music className="h-10 w-10 text-[color:var(--color-muted)]" />
              <audio className="w-full" controls preload="metadata">
                <source src={fileUrl} />
              </audio>
            </div>
          ) : null}
          {showText ? (
            <pre className="h-full w-full overflow-hidden whitespace-pre-wrap text-xs text-[color:var(--color-subtle)]">
              {textPreview}
            </pre>
          ) : null}
          {showTextPlaceholder ? (
            <div className="text-xs text-[color:var(--color-muted)]">
              空のテキストファイルです。
            </div>
          ) : null}
          {!showText &&
          !showTextPlaceholder &&
          (category === "text" || category === "other") ? (
            <div className="flex flex-col items-center gap-3 text-[color:var(--color-muted)]">
              {isLoadingText ? (
                <div className="text-xs">テキストを確認中...</div>
              ) : (
                <>
                  {category === "text" ? (
                    <FileText className="h-10 w-10" />
                  ) : (
                    <File className="h-10 w-10" />
                  )}
                  <span className="text-xs">プレビューできません</span>
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
