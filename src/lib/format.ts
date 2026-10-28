export function money(n: number, currency: string) {
  const digits = Number.isInteger(n) ? 0 : 2
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n)
}

export const pct = (v: number | null) => (v == null ? '—' : `${Math.round(v * 100)}%`)

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

const EURO_REGIONS = 'AT BE CY DE EE ES FI FR GR HR IE IT LT LU LV MT NL PT SI SK'.split(' ')
const REGION_CURRENCY: Record<string, string> = { GB: 'GBP', CA: 'CAD', AU: 'AUD', NZ: 'NZD', IN: 'INR', JP: 'JPY', CH: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK', PL: 'PLN' }

export function defaultCurrency() {
  const region = (navigator.language.split('-')[1] ?? '').toUpperCase()
  if (EURO_REGIONS.includes(region)) return 'EUR'
  return REGION_CURRENCY[region] ?? 'USD'
}

export const CURRENCIES = ['USD', 'GBP', 'EUR', 'CAD', 'AUD', 'NZD', 'INR', 'JPY', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN']

export const cn = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ')
