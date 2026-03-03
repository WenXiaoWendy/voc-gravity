const HISTORY_KEY = 'voc-history';
const MAX_HISTORY = 10;

export function getHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

export function addToHistory(word: string) {
  const history = getHistory().filter(w => w !== word);
  history.unshift(word);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
}
