import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("fileRank", {
  selectFolder: () => ipcRenderer.invoke("select-folder") as Promise<string | null>,
  startScan: (folderPath: string) =>
    ipcRenderer.invoke("scan-folder", folderPath) as Promise<ScanResult | null>,
  createRanking: (payload: CreateRankingPayload) =>
    ipcRenderer.invoke("create-ranking", payload) as Promise<RankingRecord>,
  getRankings: () => ipcRenderer.invoke("get-rankings") as Promise<RankingRecord[]>,
  getRanking: (rankingId: string) =>
    ipcRenderer.invoke("get-ranking", rankingId) as Promise<RankingRecord | null>,
  appendMatch: (payload: AppendMatchPayload) =>
    ipcRenderer.invoke("append-match", payload) as Promise<boolean>,
  updateRankingStatus: (payload: UpdateRankingStatusPayload) =>
    ipcRenderer.invoke("update-ranking-status", payload) as Promise<RankingRecord | null>,
  undoLastMatch: (rankingId: string) =>
    ipcRenderer.invoke("undo-last-match", rankingId) as Promise<RankingRecord | null>,
  deleteRanking: (rankingId: string) =>
    ipcRenderer.invoke("delete-ranking", rankingId) as Promise<boolean>,
  readTextPreview: (filePath: string) =>
    ipcRenderer.invoke("read-text-preview", filePath) as Promise<string | null>,
  cancelScan: () => ipcRenderer.send("cancel-scan"),
  onScanProgress: (listener: (payload: ScanProgress) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: ScanProgress) =>
      listener(payload);
    ipcRenderer.on("scan-progress", handler);
    return () => {
      ipcRenderer.removeListener("scan-progress", handler);
    };
  },
});

type ScanCategory = "image" | "video" | "audio" | "text" | "other";

type RankingStatus = "Progress" | "Complete";

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

type CreateRankingPayload = {
  name: string;
  folderPath: string;
  selectedExtensions: SelectedExtension[];
};

type SelectedExtension = {
  category: ScanCategory;
  extension: string;
};

type RankingFile = {
  id: string;
  path: string;
};

type RankingMatch = {
  leftId: string;
  rightId: string;
  winnerId: string | null;
};

type RankingRecord = {
  id: string;
  name: string;
  folderPath: string;
  extensions: SelectedExtension[];
  files: RankingFile[];
  matches: RankingMatch[];
  status: RankingStatus;
  createdAt: string;
};

type AppendMatchPayload = {
  rankingId: string;
  match: RankingMatch;
};

type UpdateRankingStatusPayload = {
  rankingId: string;
  status: RankingStatus;
};
