import { app, BrowserWindow, Menu, dialog, ipcMain, protocol } from "electron";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

const devServerUrl = process.env.VITE_DEV_SERVER_URL;

protocol.registerSchemesAsPrivileged([
  {
    scheme: "media",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
]);

type ScanCategory = "image" | "video" | "audio" | "text" | "other";

type ExtensionItem = {
  extension: string;
  count: number;
};

type ScanResult = {
  totalFiles: number;
  categories: Record<ScanCategory, ExtensionItem[]>;
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

type RankingStatus = "Progress" | "Complete";

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

type RankingsStore = {
  rankings: RankingRecord[];
};

function createMainWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.once("did-finish-load", () => {
      mainWindow.webContents.openDevTools({ mode: "detach" });
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "renderer", "index.html"));
  }

  mainWindow.webContents.on("before-input-event", (event, input) => {
    const isToggleDevTools =
      input.key === "F12" ||
      (input.control && input.shift && input.key.toLowerCase() === "i");
    if (isToggleDevTools) {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
  });
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createMainWindow();

  protocol.registerFileProtocol("media", (request, callback) => {
    try {
      const filePath = resolveMediaPath(request.url);
      callback({ path: filePath });
    } catch {
      callback({ error: -6 });
    }
  });

  ipcMain.handle("select-folder", async () => {
    const window = BrowserWindow.getFocusedWindow() as BrowserWindow;
    const result = await dialog.showOpenDialog(window, {
      properties: ["openDirectory"],
    });
    if (result.canceled) {
      return null;
    }
    return result.filePaths[0] ?? null;
  });

  const scanTokens = new Map<number, { canceled: boolean }>();

  ipcMain.on("cancel-scan", (event) => {
    const token = scanTokens.get(event.sender.id);
    if (token) {
      token.canceled = true;
    }
  });

  ipcMain.handle("scan-folder", async (event, folderPath: string) => {
    const token = { canceled: false };
    scanTokens.set(event.sender.id, token);

    const isCanceled = () => token.canceled;
    const totalFiles = await countFiles(folderPath, isCanceled);
    if (isCanceled()) {
      scanTokens.delete(event.sender.id);
      return null;
    }

    const categories = createEmptyCategoryMap();
    const progress = {
      processed: 0,
      total: totalFiles,
      currentPath: "",
    };
    let lastProgressSent = 0;

    for await (const filePath of walkFiles(folderPath, isCanceled)) {
      if (isCanceled()) {
        scanTokens.delete(event.sender.id);
        return null;
      }

      const extension = normalizeExtension(path.extname(filePath));
      const category = await classifyFileByType(filePath, extension);
      incrementExtension(categories[category], extension);

      progress.processed += 1;
      progress.currentPath = filePath;

      const now = Date.now();
      if (progress.processed === totalFiles || now - lastProgressSent > 120) {
        event.sender.send("scan-progress", progress);
        lastProgressSent = now;
      }
    }

    const result: ScanResult = {
      totalFiles,
      categories: toExtensionLists(categories),
    };

    scanTokens.delete(event.sender.id);
    return result;
  });

  ipcMain.handle("get-rankings", async () => {
    const store = await loadRankingsStore();
    return store.rankings;
  });

  ipcMain.handle("get-ranking", async (_event, rankingId: string) => {
    const store = await loadRankingsStore();
    return store.rankings.find((item) => item.id === rankingId) ?? null;
  });

  ipcMain.handle(
    "update-ranking-status",
    async (_event, payload: { rankingId: string; status: RankingStatus }) => {
      const store = await loadRankingsStore();
      const index = store.rankings.findIndex(
        (item) => item.id === payload.rankingId
      );
      if (index === -1) {
        return null;
      }
      store.rankings[index].status = payload.status;
      store.rankings[index].updatedAt = new Date().toISOString();
      await saveRankingsStore(store);
      return store.rankings[index];
    }
  );

  ipcMain.handle(
    "create-ranking",
    async (
      _event,
      payload: {
        name: string;
        folderPath: string;
        selectedExtensions: SelectedExtension[];
      }
    ) => {
      const files = await collectRankingFiles(
        payload.folderPath,
        payload.selectedExtensions
      );
      const record: RankingRecord = {
        id: crypto.randomUUID(),
        name: payload.name,
        folderPath: payload.folderPath,
        extensions: payload.selectedExtensions,
        files,
        matches: [],
        status: files.length <= 1 ? "Complete" : "Progress",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const store = await loadRankingsStore();
      store.rankings.unshift(record);
      await saveRankingsStore(store);
      return record;
    }
  );

  ipcMain.handle(
    "append-match",
    async (_event, payload: { rankingId: string; match: RankingMatch }) => {
      const store = await loadRankingsStore();
      const index = store.rankings.findIndex(
        (item) => item.id === payload.rankingId
      );
      if (index === -1) {
        return false;
      }
      store.rankings[index].matches.push(payload.match);
      if (store.rankings[index].status === "Complete") {
        store.rankings[index].status = "Progress";
      }
      store.rankings[index].updatedAt = new Date().toISOString();
      await saveRankingsStore(store);
      return true;
    }
  );

  ipcMain.handle("undo-last-match", async (_event, rankingId: string) => {
    const store = await loadRankingsStore();
    const index = store.rankings.findIndex((item) => item.id === rankingId);
    if (index === -1) {
      return null;
    }
    const matches = store.rankings[index].matches;
    if (matches.length === 0) {
      return store.rankings[index];
    }
    matches.pop();
    if (store.rankings[index].status === "Complete") {
      store.rankings[index].status = "Progress";
    }
    store.rankings[index].updatedAt = new Date().toISOString();
    await saveRankingsStore(store);
    return store.rankings[index];
  });

  ipcMain.handle("delete-ranking", async (_event, rankingId: string) => {
    const store = await loadRankingsStore();
    const next = store.rankings.filter((item) => item.id !== rankingId);
    if (next.length === store.rankings.length) {
      return false;
    }
    await saveRankingsStore({ rankings: next });
    return true;
  });

  ipcMain.handle("read-text-preview", async (_event, filePath: string) => {
    return readTextPreview(filePath);
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

type ScanAccumulator = Record<ScanCategory, Map<string, number>>;

const imageExtensions = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".bmp",
  ".tif",
  ".tiff",
  ".avif",
  ".heic",
  ".heif",
  ".svg",
]);

const videoExtensions = new Set([
  ".mp4",
  ".mov",
  ".mkv",
  ".avi",
  ".webm",
  ".m4v",
  ".wmv",
  ".flv",
  ".mpeg",
  ".mpg",
  ".3gp",
]);

const audioExtensions = new Set([
  ".mp3",
  ".wav",
  ".flac",
  ".aac",
  ".m4a",
  ".ogg",
  ".opus",
  ".aiff",
  ".alac",
  ".wma",
]);

function createEmptyCategoryMap(): ScanAccumulator {
  return {
    image: new Map(),
    video: new Map(),
    audio: new Map(),
    text: new Map(),
    other: new Map(),
  };
}

function toExtensionLists(categories: ScanAccumulator): Record<ScanCategory, ExtensionItem[]> {
  return {
    image: toSortedList(categories.image),
    video: toSortedList(categories.video),
    audio: toSortedList(categories.audio),
    text: toSortedList(categories.text),
    other: toSortedList(categories.other),
  };
}

function toSortedList(map: Map<string, number>): ExtensionItem[] {
  const items: ExtensionItem[] = [];
  for (const [extension, count] of map) {
    items.push({ extension, count });
  }
  items.sort((a, b) => b.count - a.count);
  return items;
}

function normalizeExtension(extension: string): string {
  if (!extension) {
    return "拡張子なし";
  }
  return extension.toLowerCase();
}

function incrementExtension(map: Map<string, number>, extension: string): void {
  const current = map.get(extension) ?? 0;
  map.set(extension, current + 1);
}

async function classifyFileByType(
  filePath: string,
  extension: string
): Promise<ScanCategory> {
  if (imageExtensions.has(extension)) {
    return "image";
  }
  if (videoExtensions.has(extension)) {
    return "video";
  }
  if (audioExtensions.has(extension)) {
    return "audio";
  }
  const isText = await isProbablyTextFile(filePath);
  return isText ? "text" : "other";
}

async function countFiles(
  rootPath: string,
  isCanceled: () => boolean
): Promise<number> {
  let total = 0;
  for await (const _filePath of walkFiles(rootPath, isCanceled)) {
    total += 1;
  }
  return total;
}

async function* walkFiles(
  rootPath: string,
  isCanceled: () => boolean
): AsyncGenerator<string> {
  if (isCanceled()) {
    return;
  }

  let entries: Awaited<ReturnType<typeof fs.opendir>>;
  try {
    entries = await fs.opendir(rootPath);
  } catch {
    return;
  }

  for await (const entry of entries) {
    if (isCanceled()) {
      return;
    }
    if (entry.isSymbolicLink()) {
      continue;
    }
    const fullPath = path.join(rootPath, entry.name);
    if (entry.isDirectory()) {
      yield* walkFiles(fullPath, isCanceled);
      continue;
    }
    if (entry.isFile()) {
      yield fullPath;
    }
  }
}

async function isProbablyTextFile(filePath: string): Promise<boolean> {
  let handle: Awaited<ReturnType<typeof fs.open>> | null = null;
  try {
    handle = await fs.open(filePath, "r");
    const buffer = Buffer.alloc(4096);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    if (bytesRead === 0) {
      return true;
    }

    return isProbablyTextBuffer(buffer, bytesRead);
  } catch {
    return false;
  } finally {
    if (handle) {
      await handle.close();
    }
  }
}

function resolveMediaPath(urlString: string): string {
  const url = new URL(urlString);
  let filePath = decodeURIComponent(url.pathname);
  if (process.platform === "win32") {
    if (/^[a-zA-Z]$/.test(url.hostname)) {
      filePath = `${url.hostname}:${filePath}`;
    }
    if (filePath.startsWith("/")) {
      filePath = filePath.slice(1);
    }
  }
  return path.normalize(filePath);
}

async function readTextPreview(filePath: string): Promise<string | null> {
  let handle: Awaited<ReturnType<typeof fs.open>> | null = null;
  try {
    handle = await fs.open(filePath, "r");
    const buffer = Buffer.alloc(8192);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    if (bytesRead === 0) {
      return "";
    }
    if (!isProbablyTextBuffer(buffer, bytesRead)) {
      return null;
    }
    const text = buffer.toString("utf8", 0, bytesRead);
    return text.replace(/\0/g, "").trim();
  } catch {
    return null;
  } finally {
    if (handle) {
      await handle.close();
    }
  }
}

function isProbablyTextBuffer(buffer: Buffer, bytesRead: number): boolean {
  let suspicious = 0;
  for (let index = 0; index < bytesRead; index += 1) {
    const byte = buffer[index];
    if (byte === 0) {
      return false;
    }
    const isControl = byte < 7 || (byte > 13 && byte < 32) || byte === 127;
    if (isControl) {
      suspicious += 1;
    }
  }
  return suspicious / bytesRead < 0.3;
}

const rankingsStoreFile = () =>
  path.join(app.getPath("userData"), "rankings.json");

async function loadRankingsStore(): Promise<RankingsStore> {
  const filePath = rankingsStoreFile();
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as RankingsStore;
    return {
      rankings: Array.isArray(parsed.rankings)
        ? parsed.rankings.map(normalizeRankingRecord)
        : [],
    };
  } catch {
    return { rankings: [] };
  }
}

async function saveRankingsStore(store: RankingsStore): Promise<void> {
  const filePath = rankingsStoreFile();
  await fs.writeFile(filePath, JSON.stringify(store, null, 2), "utf8");
}

function normalizeRankingRecord(record: RankingRecord): RankingRecord {
  const createdAt = record.createdAt ?? new Date().toISOString();
  const updatedAt = record.updatedAt ?? createdAt;
  return {
    ...record,
    extensions: Array.isArray(record.extensions) ? record.extensions : [],
    files: Array.isArray(record.files) ? record.files : [],
    matches: Array.isArray(record.matches) ? record.matches : [],
    status: record.status === "Complete" ? "Complete" : "Progress",
    createdAt,
    updatedAt,
  };
}

async function collectRankingFiles(
  folderPath: string,
  selectedExtensions: SelectedExtension[]
): Promise<RankingFile[]> {
  const selection = new Set(
    selectedExtensions.map((item) => `${item.category}:${item.extension}`)
  );
  const files: RankingFile[] = [];
  for await (const filePath of walkFiles(folderPath, () => false)) {
    const extension = normalizeExtension(path.extname(filePath));
    const category = await classifyFileByType(filePath, extension);
    if (!selection.has(`${category}:${extension}`)) {
      continue;
    }
    files.push({ id: crypto.randomUUID(), path: filePath });
  }
  return files;
}
