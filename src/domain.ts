import { nid, nowISO } from './format'
import type {
  AppState,
  Application,
  Employer,
  EmploymentRecord,
  EmploymentStatus,
  Notification,
  PersonStatus,
  Role,
  Vacancy,
  VacancyStatus,
} from './types'

export function hasOpenApplication(applications: Application[], personId: string, vacancyId: string): boolean {
  return applications.some(
    (item) =>
      item.personId === personId &&
      item.vacancyId === vacancyId &&
      item.status !== 'employer_rejected' &&
      item.status !== 'candidate_rejected',
  )
}

export function vacancyIsOpen(vacancy: Vacancy, employers: Employer[]): boolean {
  if (vacancy.status !== 'active' || vacancy.openings < 1) return false
  const employer = employers.find((item) => item.id === vacancy.employerId)
  return !!employer && employer.cooperation !== 'terminated' && employer.cooperation !== 'no_vacancies'
}

export function homeFor(role: Role): string {
  if (role === 'probationer') return '/p'
  if (role === 'employer') return '/e'
  if (role === 'officer') return '/o'
  return '/a'
}

export function noticesPath(role: Role): string {
  if (role === 'probationer') return '/p/notices'
  if (role === 'employer') return '/e/notices'
  if (role === 'officer') return '/o/notices'
  return '/a/notices'
}

export function derivePersonStatus(
  personId: string,
  applications: Application[],
  trainingIds: { personId: string; status: string }[],
  employments: EmploymentRecord[],
): PersonStatus {
  const jobs = employments.filter((item) => item.personId === personId)
  if (jobs.some((item) => item.employmentStatus !== 'finished')) return 'employed'
  const own = applications.filter((item) => item.personId === personId)
  if (jobs.length === 0 && own.some((item) => item.status === 'accepted')) return 'employed'
  if (own.some((item) => item.status === 'interviewing')) return 'interviewing'
  if (own.some((item) => item.status === 'invited')) return 'invited'
  if (own.some((item) => item.status === 'referred')) return 'referred'
  if (trainingIds.some((item) => item.personId === personId && item.status !== 'completed')) return 'training'
  if (own.some((item) => item.status === 'employer_rejected')) return 'employer_rejected'
  if (own.some((item) => item.status === 'candidate_rejected')) return 'candidate_rejected'
  return 'seeking'
}

export function withDerived(state: AppState): AppState {
  return {
    ...state,
    people: state.people.map((person) => ({
      ...person,
      status: derivePersonStatus(person.id, state.applications, state.trainingReferrals, state.employments),
    })),
  }
}

export function addNote(state: AppState, input: Omit<Notification, 'id' | 'createdAt' | 'read'>): AppState {
  if (!input.userId) return state
  const note: Notification = { ...input, id: nid('n'), createdAt: nowISO(), read: false }
  return { ...state, notifications: [note, ...state.notifications] }
}

export function employPerson(state: AppState, input: Omit<EmploymentRecord, 'id'>): AppState {
  const now = nowISO()
  let applications = state.applications
  let vacancies = state.vacancies
  if (input.vacancyId && input.employmentStatus !== 'finished') {
    const existing = applications.find(
      (item) => item.personId === input.personId && item.vacancyId === input.vacancyId,
    )
    const alreadyAccepted = existing?.status === 'accepted'
    if (existing && !alreadyAccepted && existing.status !== 'employer_rejected' && existing.status !== 'candidate_rejected') {
      applications = applications.map((item) =>
        item.id === existing.id ? { ...item, status: 'accepted', updatedAt: now } : item,
      )
    }
    if (!alreadyAccepted) {
      vacancies = vacancies.map((vacancy) => {
        if (vacancy.id !== input.vacancyId) return vacancy
        const openings = Math.max(0, vacancy.openings - 1)
        const status: VacancyStatus = openings === 0 ? 'closed' : vacancy.status
        return { ...vacancy, openings, status }
      })
    }
  }
  const record: EmploymentRecord = { ...input, id: nid('job') }
  const employments = [
    record,
    ...state.employments.map((item) =>
      item.personId === input.personId && item.employmentStatus !== 'finished'
        ? { ...item, employmentStatus: 'finished' as EmploymentStatus }
        : item,
    ),
  ]
  return withDerived({ ...state, applications, vacancies, employments })
}
