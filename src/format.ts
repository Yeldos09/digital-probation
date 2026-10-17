import type { Lang, Localized } from './types'

export function text(value: string | Localized, lang: Lang): string {
  return typeof value === 'string' ? value : value[lang]
}

export function money(value: number, lang: Lang): string {
  const formatted = new Intl.NumberFormat(lang === 'kk' ? 'kk-KZ' : 'ru-KZ').format(value)
  return `${formatted} ₸`
}

export function moneyRange(from: number, to: number, lang: Lang): string {
  return `${money(from, lang)} – ${money(to, lang)}`
}

export function monthLabel(id: string, lang: Lang): string {
  const month = Number(id.slice(5, 7))
  const names =
    lang === 'kk'
      ? ['қаң', 'ақп', 'нау', 'сәу', 'мам', 'мау', 'шіл', 'там', 'қыр', 'қаз', 'қар', 'жел']
      : ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
  return names[month - 1] ?? id
}

export function scoreTone(score: number): 'high' | 'mid' | 'low' {
  if (score >= 85) return 'high'
  if (score >= 70) return 'mid'
  return 'low'
}

export function formatDate(iso: string, lang: Lang): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString(lang === 'kk' ? 'kk-KZ' : 'ru-KZ', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function formatDateTime(iso: string, lang: Lang): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString(lang === 'kk' ? 'kk-KZ' : 'ru-KZ', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function yearsRu(n: number): string {
  const n10 = n % 10
  const n100 = n % 100
  if (n10 === 1 && n100 !== 11) return `${n} год`
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return `${n} года`
  return `${n} лет`
}

export function joinClauses(parts: string[], lang: Lang): string {
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0]
  const conj = lang === 'ru' ? ' и ' : ' және '
  return parts.slice(0, -1).join(', ') + conj + parts[parts.length - 1]
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function nowISO(): string {
  return new Date().toISOString()
}

export function nid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`
}
