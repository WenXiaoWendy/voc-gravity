const FAVORITES_KEY = 'voc-favorites';

export interface FavoriteItem {
  word: string;
  addedAt: number;
}

export function getFavorites(): FavoriteItem[] {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  } catch {
    return [];
  }
}

export function isFavorited(word: string): boolean {
  return getFavorites().some(f => f.word === word);
}

export function addToFavorites(word: string): void {
  const favorites = getFavorites().filter(f => f.word !== word);
  favorites.unshift({ word, addedAt: Date.now() });
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

export function removeFromFavorites(word: string): void {
  const favorites = getFavorites().filter(f => f.word !== word);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

export function toggleFavorite(word: string): boolean {
  if (isFavorited(word)) {
    removeFromFavorites(word);
    return false;
  } else {
    addToFavorites(word);
    return true;
  }
}
