const KEY = 'devhub:recently-viewed'
const MAX = 10

export function trackRecentlyViewed(id: string) {
  try {
    const stored = localStorage.getItem(KEY)
    const ids: string[] = stored ? JSON.parse(stored) : []
    const filtered = ids.filter((i) => i !== id)
    filtered.unshift(id)
    localStorage.setItem(KEY, JSON.stringify(filtered.slice(0, MAX)))
  } catch {
    // ignore — SSR or private browsing
  }
}

export function getRecentlyViewedIds(): string[] {
  try {
    const stored = localStorage.getItem(KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}
