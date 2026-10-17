import type { AppState, PersonStatus, ReasonId } from './types'

const PIPELINE: PersonStatus[] = ['referred', 'invited', 'interviewing']

export interface Slice {
  total: number
  unemployed: number
  employed: number
  referred: number
  training: number
  refusals: number
  rate: number
}

export function sampleSlice(state: AppState): Slice {
  const people = state.people
  const total = people.length
  const employed = people.filter((item) => item.status === 'employed').length
  const referred = people.filter((item) => PIPELINE.includes(item.status)).length
  const training = people.filter((item) => item.status === 'training').length
  const unemployed = Math.max(0, total - employed - referred - training)
  const refusals = state.applications.filter(
    (item) => item.status === 'employer_rejected' || item.status === 'candidate_rejected',
  ).length
  const rate = total === 0 ? 0 : Math.round((employed / total) * 1000) / 10
  return { total, unemployed, employed, referred, training, refusals, rate }
}

export function countBy(items: string[]): { id: string; count: number }[] {
  const map = new Map<string, number>()
  for (const id of items) map.set(id, (map.get(id) ?? 0) + 1)
  return [...map.entries()]
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id))
}

export function sampleMonths(state: AppState): { id: string; employed: number }[] {
  const map = new Map<string, number>()
  for (const job of state.employments) {
    if (job.employmentStatus === 'finished') continue
    const id = job.date.slice(0, 7)
    map.set(id, (map.get(id) ?? 0) + 1)
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([id, employed]) => ({ id, employed }))
}

export function sampleReasons(state: AppState): { id: ReasonId; count: number }[] {
  const map = new Map<ReasonId, number>()
  for (const item of state.applications) {
    if (item.status !== 'employer_rejected' && item.status !== 'candidate_rejected') continue
    if (!item.reasonId) continue
    map.set(item.reasonId, (map.get(item.reasonId) ?? 0) + 1)
  }
  return [...map.entries()]
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count)
}
