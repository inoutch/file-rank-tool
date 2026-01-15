export function toFileUrl(filePath: string): string {
  const normalized = filePath.replace(/\\/g, "/");
  const encoded = encodeURI(normalized);
  if (/^[A-Za-z]:\//.test(normalized)) {
    return `media:///${encoded}`;
  }
  return `media://${encoded}`;
}
