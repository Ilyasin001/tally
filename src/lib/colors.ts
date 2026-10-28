import type { CSSProperties } from 'react'

export const PALETTE = ['#8b7cf6', '#38bdf8', '#fb7185', '#34d399', '#fbbf24', '#f472b6', '#22d3ee', '#a3e635', '#fb923c', '#c084fc']

/** Gives each distinct label its own palette colour, in order of first appearance. */
export function paletteMap(labels: string[]) {
  const map = new Map<string, string>()
  for (const l of labels) if (!map.has(l)) map.set(l, PALETTE[map.size % PALETTE.length])
  return (label: string) => map.get(label) ?? PALETTE[0]
}

export const habitCategory = (h: { category: string }) => h.category || 'Other'

/** Soft background + readable text in either theme for a coloured pill. */
export const tint = (color: string): CSSProperties => ({
  background: `color-mix(in oklab, ${color} 16%, transparent)`,
  color: `color-mix(in oklab, ${color} 72%, var(--text))`,
})
