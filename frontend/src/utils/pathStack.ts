const KEY = 'voc-path';

export function loadPath(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function savePath(path: string[]): void {
  localStorage.setItem(KEY, JSON.stringify(path));
}

/** 成功搜索词后更新路径：若词已在栈中则截断到该位置，否则 push 到末尾 */
export function pushToPath(current: string[], word: string): string[] {
  const idx = current.indexOf(word);
  const next = idx >= 0 ? current.slice(0, idx + 1) : [...current, word];
  savePath(next);
  return next;
}
