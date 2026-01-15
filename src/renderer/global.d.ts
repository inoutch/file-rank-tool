export {};

declare global {
  interface Window {
    fileRank: {
      selectFolder: () => Promise<string | null>;
      startScan: (folderPath: string) => Promise<ScanResult | null>;
      createRanking: (payload: CreateRankingPayload) => Promise<RankingRecord>;
      getRankings: () => Promise<RankingRecord[]>;
      getRanking: (rankingId: string) => Promise<RankingRecord | null>;
      appendMatch: (payload: AppendMatchPayload) => Promise<boolean>;
      updateRankingStatus: (
        payload: UpdateRankingStatusPayload
      ) => Promise<RankingRecord | null>;
      undoLastMatch: (rankingId: string) => Promise<RankingRecord | null>;
      deleteRanking: (rankingId: string) => Promise<boolean>;
      readTextPreview: (filePath: string) => Promise<string | null>;
      cancelScan: () => void;
      onScanProgress: (listener: (payload: ScanProgress) => void) => () => void;
    };
  }
}

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
  updatedAt: string;
};

type AppendMatchPayload = {
  rankingId: string;
  match: RankingMatch;
};

type UpdateRankingStatusPayload = {
  rankingId: string;
  status: RankingStatus;
};
