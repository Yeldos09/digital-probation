import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  CITIES,
  DISTRICTS_BY_CITY,
  EDUCATIONS,
  PROFESSIONS,
  SPHERES,
} from './constants'
import { addNote, employPerson, hasOpenApplication, vacancyIsOpen, withDerived } from './domain'
import { nid, nowISO, text, todayISO } from './format'
import { L, L2, translate } from './i18n'
import { explainMatch, rankVacancies, shouldRecommendTraining, suggestedCourses } from './matching'
import { createSeedState } from './seed'
import type {
  AppState,
  ApplicationStatus,
  CityId,
  DistrictId,
  Employer,
  EmploymentRecord,
  EmploymentType,
  Lang,
  Localized,
  Person,
  ReasonId,
  Role,
  SphereId,
  User,
  Vacancy,
} from './types'

const KEY = 'digital-probation-v1'

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return createSeedState()
    const parsed = JSON.parse(raw) as { v?: number; state?: AppState }
    if (parsed.v !== 1 || !parsed.state?.people || parsed.state.people.length < 20 || !parsed.state.vacancies || parsed.state.vacancies.length < 30) {
      return createSeedState()
    }
    return { ...parsed.state, toast: null }
  } catch {
    return createSeedState()
  }
}

export type PersonDraft = {
  fullName: string
  phone: string
  city: CityId
  district: DistrictId
  login: string
  password: string
}

export type EmployerDraft = {
  name: string
  sphere: SphereId
  city: CityId
  district: DistrictId
  address: string
  contactName: string
  phone: string
  login: string
  password: string
}

type StoreValue = {
  state: AppState
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string, vars?: Record<string, string | number>) => string
  tx: (value: string | Localized) => string
  user: User | null
  person: Person | null
  employer: Employer | null
  notices: AppState['notifications']
  unread: number
  signIn: (login: string, password: string) => Role | null
  signOut: () => void
  resetDemo: () => void
  dismissToast: () => void
  signUpPerson: (draft: PersonDraft, enter?: boolean) => { ok: boolean; personId?: string }
  signUpEmployer: (draft: EmployerDraft) => boolean
  saveProfile: (personId: string, patch: Person, asPerson?: boolean) => boolean
  saveEmployer: (employerId: string, patch: Employer) => void
  saveVacancy: (vacancy: Vacancy) => void
  refer: (personId: string, vacancyId: string, by: 'officer' | 'self') => void
  invitePerson: (personId: string, vacancyId: string) => void
  moveApplication: (applicationId: string, status: Extract<ApplicationStatus, 'invited' | 'interviewing'>) => void
  acceptApplication: (applicationId: string) => void
  rejectApplication: (applicationId: string, side: 'employer' | 'candidate', reasonId: ReasonId, comment: string) => void
  referTraining: (personId: string, courseId: string) => void
  recordEmployment: (input: Omit<EmploymentRecord, 'id'>) => void
  markAllRead: () => void
}

const StoreContext = createContext<StoreValue | null>(null)

function watchers(state: AppState): string[] {
  return state.users.filter((item) => item.role === 'officer' || item.role === 'admin').map((item) => item.id)
}

function filled(value: Localized): Localized {
  const ru = value.ru.trim()
  const kk = value.kk.trim()
  return { ru: ru || kk, kk: kk || ru }
}

function personHref(state: AppState, userId: string, personId: string): string {
  return state.users.find((item) => item.id === userId)?.role === 'admin' ? `/a/people/${personId}` : `/o/people/${personId}`
}

function analyticsHref(state: AppState, userId: string): string {
  return state.users.find((item) => item.id === userId)?.role === 'officer' ? '/o/analytics' : '/a'
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(load)
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem('dp-lang') === 'kk' ? 'kk' : 'ru'))
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify({ v: 1, state: { ...state, toast: null } }))
  }, [state])

  useEffect(() => {
    document.documentElement.lang = lang === 'kk' ? 'kk' : 'ru'
  }, [lang])

  useEffect(() => {
    if (!state.toast) return
    const timer = window.setTimeout(() => setState((prev) => ({ ...prev, toast: null })), 4600)
    return () => window.clearTimeout(timer)
  }, [state.toast])

  const setLang = (next: Lang) => {
    localStorage.setItem('dp-lang', next)
    setLangState(next)
  }

  const value = useMemo<StoreValue>(() => {
    const user = state.users.find((item) => item.id === state.sessionUserId) ?? null
    const person = user?.personId ? state.people.find((item) => item.id === user.personId) ?? null : null
    const employer = user?.employerId ? state.employers.find((item) => item.id === user.employerId) ?? null : null
    const notices = state.notifications.filter((item) => item.userId === user?.id)
    const t = (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars)
    const tx = (item: string | Localized) => text(item, lang)

    return {
      state,
      lang,
      setLang,
      t,
      tx,
      user,
      person,
      employer,
      notices,
      unread: notices.filter((item) => !item.read).length,
      dismissToast: () => setState((prev) => ({ ...prev, toast: null })),
      signOut: () => setState((prev) => ({ ...prev, sessionUserId: null, toast: null })),
      resetDemo: () => {
        localStorage.removeItem(KEY)
        setState({ ...createSeedState(), toast: L('toast.reset') })
      },
      signIn: (login, password) => {
        const found = stateRef.current.users.find(
          (item) => item.login.toLowerCase() === login.trim().toLowerCase() && item.password === password,
        )
        if (!found) {
          setState((prev) => ({ ...prev, toast: L('toast.badLogin') }))
          return null
        }
        setState((prev) => ({ ...prev, sessionUserId: found.id, toast: null }))
        return found.role
      },
      signUpPerson: (draft, enter = true) => {
        const prev = stateRef.current
        if (!draft.fullName.trim() || !draft.phone.trim() || draft.password.trim().length < 4 || !draft.login.trim()) {
          setState((current) => ({ ...current, toast: L('toast.required') }))
          return { ok: false }
        }
        if (prev.users.some((item) => item.login.toLowerCase() === draft.login.trim().toLowerCase())) {
          setState((current) => ({ ...current, toast: L('toast.loginTaken') }))
          return { ok: false }
        }
        const personId = nid('p')
        const userId = nid('u')
        const districtOk = (DISTRICTS_BY_CITY[draft.city] ?? []).includes(draft.district)
        const district = districtOk ? draft.district : DISTRICTS_BY_CITY[draft.city][0]
        const created: Person = {
          id: personId,
          userId,
          officerId: 'u-officer',
          fullName: draft.fullName.trim(),
          age: 18,
          gender: 'male',
          district,
          city: draft.city,
          education: 'secondary',
          specialty: { ru: '', kk: '' },
          profession: 'helper',
          experience: { ru: '', kk: '' },
          experienceYears: 0,
          skills: [],
          hasLicense: false,
          licenseCategories: [],
          desiredProfession: 'helper',
          desiredSalary: 200000,
          fullTime: true,
          shiftWork: false,
          hasVocationalEducation: false,
          needsTraining: false,
          phone: draft.phone.trim(),
          status: 'seeking',
          profileComplete: false,
        }
        const account: User = {
          id: userId,
          role: 'probationer',
          login: draft.login.trim(),
          password: draft.password,
          name: created.fullName,
          personId,
        }
        setState((current) => ({
          ...current,
          users: [...current.users, account],
          people: [...current.people, created],
          sessionUserId: enter ? userId : current.sessionUserId,
          toast: L('toast.registered'),
        }))
        return { ok: true, personId }
      },
      signUpEmployer: (draft) => {
        const prev = stateRef.current
        if (!draft.name.trim() || !draft.address.trim() || !draft.contactName.trim() || !draft.phone.trim() || draft.password.trim().length < 4 || !draft.login.trim()) {
          setState((current) => ({ ...current, toast: L('toast.required') }))
          return false
        }
        if (!SPHERES.includes(draft.sphere) || !CITIES.includes(draft.city)) return false
        if (prev.users.some((item) => item.login.toLowerCase() === draft.login.trim().toLowerCase())) {
          setState((current) => ({ ...current, toast: L('toast.loginTaken') }))
          return false
        }
        const employerId = nid('e')
        const userId = nid('u')
        const district = (DISTRICTS_BY_CITY[draft.city] ?? []).includes(draft.district)
          ? draft.district
          : DISTRICTS_BY_CITY[draft.city][0]
        const created: Employer = {
          id: employerId,
          userId,
          name: draft.name.trim(),
          sphere: draft.sphere,
          city: draft.city,
          district,
          address: { ru: draft.address.trim(), kk: draft.address.trim() },
          contactName: draft.contactName.trim(),
          phone: draft.phone.trim(),
          cooperation: 'active',
        }
        const account: User = {
          id: userId,
          role: 'employer',
          login: draft.login.trim(),
          password: draft.password,
          name: created.name,
          employerId,
        }
        setState((current) => ({
          ...current,
          users: [...current.users, account],
          employers: [...current.employers, created],
          sessionUserId: userId,
          toast: L('toast.registered'),
        }))
        return true
      },
      saveProfile: (personId, patch, asPerson = false) => {
        const specialty = filled(patch.specialty)
        const experience = filled(patch.experience)
        if (!patch.fullName.trim() || !patch.phone.trim() || !specialty.ru || !experience.ru || patch.age < 18 || patch.age > 80 || patch.desiredSalary < 50000) {
          setState((current) => ({ ...current, toast: L('toast.required') }))
          return false
        }
        if (!PROFESSIONS.includes(patch.profession) || !EDUCATIONS.includes(patch.education)) return false
        let saved = false
        setState((current) => {
          const actor = current.users.find((item) => item.id === current.sessionUserId)
          const previous = current.people.find((item) => item.id === personId)
          if (!previous) return { ...current, toast: L('toast.missing') }
          if (!asPerson) {
            const own = actor?.role === 'probationer' && actor.personId === personId
            const officer = actor?.role === 'officer' && previous.officerId === actor.id
            if (!own && !officer) return { ...current, toast: L('toast.denied') }
          }
          saved = true
          const nextPerson: Person = {
            ...patch,
            specialty,
            experience,
            id: personId,
            userId: previous.userId,
            officerId: previous.officerId,
            profileComplete: true,
          }
          let next: AppState = {
            ...current,
            people: current.people.map((item) => (item.id === personId ? nextPerson : item)),
            users: current.users.map((item) => (item.id === previous.userId ? { ...item, name: nextPerson.fullName } : item)),
            toast: L('toast.saved'),
          }
          if (!previous.profileComplete && nextPerson.userId) {
            const top = rankVacancies(nextPerson, next.vacancies, next.employers)[0]
            if (top && top.score >= 70) {
              next = addNote(next, {
                userId: nextPerson.userId,
                type: 'match',
                title: L('note.match.title'),
                body: L2('note.match.body', {
                  ru: { vacancy: top.vacancy.title.ru, score: top.score },
                  kk: { vacancy: top.vacancy.title.kk, score: top.score },
                }),
                href: '/p/matches',
              })
            }
            if (shouldRecommendTraining(nextPerson, top?.score ?? null)) {
              const course = suggestedCourses(nextPerson, next.courses, top?.score ?? null)[0]
              if (course) {
                next = addNote(next, {
                  userId: nextPerson.userId,
                  type: 'training',
                  title: L('note.training.title'),
                  body: L2('note.training.body', {
                    ru: { course: course.title.ru },
                    kk: { course: course.title.kk },
                  }),
                  href: '/p/training',
                })
              }
            }
          }
          return next
        })
        return saved
      },
      saveEmployer: (employerId, patch) => {
        const actor = stateRef.current.users.find((item) => item.id === stateRef.current.sessionUserId)
        if (!actor || actor.role !== 'employer' || actor.employerId !== employerId) {
          setState((current) => ({ ...current, toast: L('toast.denied') }))
          return
        }
        const address = filled(patch.address)
        if (!patch.name.trim() || !address.ru || !patch.phone.trim()) {
          setState((current) => ({ ...current, toast: L('toast.required') }))
          return
        }
        setState((current) => ({
          ...current,
          employers: current.employers.map((item) => (item.id === employerId ? { ...patch, address, id: employerId, userId: item.userId } : item)),
          users: current.users.map((item) => (item.employerId === employerId ? { ...item, name: patch.name } : item)),
          toast: L('toast.orgSaved'),
        }))
      },
      saveVacancy: (vacancy) => {
        const actor = stateRef.current.users.find((item) => item.id === stateRef.current.sessionUserId)
        if (!actor || actor.role !== 'employer' || actor.employerId !== vacancy.employerId) {
          setState((current) => ({ ...current, toast: L('toast.denied') }))
          return
        }
        if (vacancy.salaryFrom > vacancy.salaryTo || vacancy.openings < 0) {
          setState((current) => ({ ...current, toast: L('toast.salary') }))
          return
        }
        const nextVacancy: Vacancy = {
          ...vacancy,
          address: filled(vacancy.address),
          requirements: filled(vacancy.requirements),
          title: filled(vacancy.title),
        }
        setState((current) => {
          const exists = current.vacancies.some((item) => item.id === nextVacancy.id)
          return {
            ...current,
            vacancies: exists
              ? current.vacancies.map((item) => (item.id === nextVacancy.id ? nextVacancy : item))
              : [nextVacancy, ...current.vacancies],
            toast: L('toast.vacancySaved'),
          }
        })
      },
      refer: (personId, vacancyId, by) => {
        setState((current) => {
          const person = current.people.find((item) => item.id === personId)
          const vacancy = current.vacancies.find((item) => item.id === vacancyId)
          const company = current.employers.find((item) => item.id === vacancy?.employerId)
          if (!person || !vacancy || !company) return { ...current, toast: L('toast.missing') }
          const actor = current.users.find((item) => item.id === current.sessionUserId)
          if (by === 'officer' && (!actor || actor.role !== 'officer' || person.officerId !== actor.id)) {
            return { ...current, toast: L('toast.denied') }
          }
          if (by === 'self' && actor && actor.role !== 'admin' && !(actor.role === 'probationer' && actor.personId === personId)) {
            return { ...current, toast: L('toast.denied') }
          }
          if (person.status === 'employed') return { ...current, toast: L('toast.denied') }
          if (!vacancyIsOpen(vacancy, current.employers)) return { ...current, toast: L('toast.closed') }
          if (hasOpenApplication(current.applications, personId, vacancyId)) return { ...current, toast: L('toast.dup') }
          const match = explainMatch(person, vacancy)
          const now = nowISO()
          let next: AppState = {
            ...current,
            applications: [
              {
                id: nid('app'),
                personId,
                vacancyId,
                employerId: company.id,
                status: 'referred',
                score: match.score,
                reason: match.reason,
                createdAt: now,
                updatedAt: now,
              },
              ...current.applications,
            ],
          }
          if (company.userId) {
            next = addNote(next, {
              userId: company.userId,
              type: 'referral',
              title: L(by === 'self' ? 'note.apply.emp.title' : 'note.refer.emp.title'),
              body: L2(by === 'self' ? 'note.apply.emp.body' : 'note.refer.emp.body', {
                ru: { name: person.fullName, vacancy: vacancy.title.ru },
                kk: { name: person.fullName, vacancy: vacancy.title.kk },
              }),
              href: '/e/candidates',
            })
          }
          if (person.userId) {
            next = addNote(next, {
              userId: person.userId,
              type: by === 'self' ? 'referral' : 'referral',
              title: L(by === 'self' ? 'note.apply.person.title' : 'note.refer.person.title'),
              body: L2(by === 'self' ? 'note.apply.person.body' : 'note.refer.person.body', {
                ru: { vacancy: vacancy.title.ru, org: company.name },
                kk: { vacancy: vacancy.title.kk, org: company.name },
              }),
              href: '/p/applications',
            })
          }
          for (const userId of watchers(next)) {
            next = addNote(next, {
              userId,
              type: 'referral',
              title: L('note.refer.officer.title'),
              body: L2('note.refer.officer.body', {
                ru: { name: person.fullName, org: company.name },
                kk: { name: person.fullName, org: company.name },
              }),
              href: personHref(next, userId, person.id),
            })
          }
          return { ...withDerived(next), toast: L('toast.referred') }
        })
      },
      invitePerson: (personId, vacancyId) => {
        setState((current) => {
          const person = current.people.find((item) => item.id === personId)
          const vacancy = current.vacancies.find((item) => item.id === vacancyId)
          const company = current.employers.find((item) => item.id === vacancy?.employerId)
          const actor = current.users.find((item) => item.id === current.sessionUserId)
          if (!person || !vacancy || !company) return { ...current, toast: L('toast.missing') }
          if (!actor || actor.role !== 'employer' || actor.employerId !== company.id) return { ...current, toast: L('toast.denied') }
          if (person.status === 'employed' || !vacancyIsOpen(vacancy, current.employers)) return { ...current, toast: L('toast.closed') }
          const existing = current.applications.find(
            (item) => item.personId === personId && item.vacancyId === vacancyId && item.status !== 'employer_rejected' && item.status !== 'candidate_rejected',
          )
          if (existing && existing.status !== 'referred') return { ...current, toast: L('toast.dup') }
          const match = explainMatch(person, vacancy)
          const now = nowISO()
          const applications = existing
            ? current.applications.map((item) => (item.id === existing.id ? { ...item, status: 'invited' as const, updatedAt: now } : item))
            : [
                {
                  id: nid('app'),
                  personId,
                  vacancyId,
                  employerId: company.id,
                  status: 'invited' as const,
                  score: match.score,
                  reason: match.reason,
                  createdAt: now,
                  updatedAt: now,
                },
                ...current.applications,
              ]
          let next: AppState = { ...current, applications }
          if (person.userId) {
            next = addNote(next, {
              userId: person.userId,
              type: 'invite',
              title: L('note.invite.title'),
              body: L2('note.invite.body', {
                ru: { org: company.name, vacancy: vacancy.title.ru },
                kk: { org: company.name, vacancy: vacancy.title.kk },
              }),
              href: '/p/applications',
            })
          }
          return { ...withDerived(next), toast: L('toast.invited') }
        })
      },
      moveApplication: (applicationId, status) => {
        setState((current) => {
          const application = current.applications.find((item) => item.id === applicationId)
          const actor = current.users.find((item) => item.id === current.sessionUserId)
          if (!application || application.status === 'accepted') return { ...current, toast: L('toast.missing') }
          if (!actor || actor.role !== 'employer' || actor.employerId !== application.employerId) return { ...current, toast: L('toast.denied') }
          const person = current.people.find((item) => item.id === application.personId)
          if (person?.status === 'employed') return { ...current, toast: L('toast.denied') }
          const vacancy = current.vacancies.find((item) => item.id === application.vacancyId)
          const company = current.employers.find((item) => item.id === application.employerId)
          let next: AppState = {
            ...current,
            applications: current.applications.map((item) =>
              item.id === applicationId ? { ...item, status, updatedAt: nowISO() } : item,
            ),
          }
          if (status === 'invited' && person?.userId && vacancy && company) {
            next = addNote(next, {
              userId: person.userId,
              type: 'invite',
              title: L('note.invite.title'),
              body: L2('note.invite.body', {
                ru: { org: company.name, vacancy: vacancy.title.ru },
                kk: { org: company.name, vacancy: vacancy.title.kk },
              }),
              href: '/p/applications',
            })
          }
          return { ...withDerived(next), toast: L(status === 'invited' ? 'toast.invited' : 'toast.interview') }
        })
      },
      acceptApplication: (applicationId) => {
        setState((current) => {
          const application = current.applications.find((item) => item.id === applicationId)
          const person = current.people.find((item) => item.id === application?.personId)
          const vacancy = current.vacancies.find((item) => item.id === application?.vacancyId)
          const company = current.employers.find((item) => item.id === application?.employerId)
          const actor = current.users.find((item) => item.id === current.sessionUserId)
          if (!application || !person || !vacancy || !company) return { ...current, toast: L('toast.missing') }
          if (!actor || actor.role !== 'employer' || actor.employerId !== company.id) return { ...current, toast: L('toast.denied') }
          if (person.status === 'employed' || application.status === 'accepted') return { ...current, toast: L('toast.dup') }
          const employmentType: EmploymentType =
            vacancy.schedule === 'shift' ? 'shift' : vacancy.schedule === 'flexible' ? 'partial' : 'full'
          let next = employPerson(current, {
            personId: person.id,
            employerId: company.id,
            vacancyId: vacancy.id,
            organization: company.name,
            position: vacancy.title,
            date: todayISO(),
            employmentType,
            employmentStatus: 'active',
          })
          if (person.userId) {
            next = addNote(next, {
              userId: person.userId,
              type: 'accepted',
              title: L('note.accept.title'),
              body: L2('note.accept.body', {
                ru: { org: company.name, position: vacancy.title.ru },
                kk: { org: company.name, position: vacancy.title.kk },
              }),
              href: '/p/card',
            })
          }
          for (const userId of watchers(next)) {
            next = addNote(next, {
              userId,
              type: 'accepted',
              title: L('note.hired.title'),
              body: L2('note.hired.body', {
                ru: { name: person.fullName, org: company.name },
                kk: { name: person.fullName, org: company.name },
              }),
              href: analyticsHref(next, userId),
            })
          }
          return { ...next, toast: L('toast.accepted') }
        })
      },
      rejectApplication: (applicationId, side, reasonId, comment) => {
        setState((current) => {
          const application = current.applications.find((item) => item.id === applicationId)
          const actor = current.users.find((item) => item.id === current.sessionUserId)
          if (!application || application.status === 'accepted') return { ...current, toast: L('toast.missing') }
          if (side === 'employer' && (!actor || actor.role !== 'employer' || actor.employerId !== application.employerId || reasonId === 'candidate')) {
            return { ...current, toast: L('toast.denied') }
          }
          if (side === 'candidate' && (!actor || actor.role !== 'probationer' || actor.personId !== application.personId)) {
            return { ...current, toast: L('toast.denied') }
          }
          const status: ApplicationStatus = side === 'employer' ? 'employer_rejected' : 'candidate_rejected'
          const person = current.people.find((item) => item.id === application.personId)
          const vacancy = current.vacancies.find((item) => item.id === application.vacancyId)
          const company = current.employers.find((item) => item.id === application.employerId)
          let next: AppState = {
            ...current,
            applications: current.applications.map((item) =>
              item.id === applicationId ? { ...item, status, reasonId, comment, updatedAt: nowISO() } : item,
            ),
          }
          if (side === 'employer' && person?.userId && company && vacancy) {
            next = addNote(next, {
              userId: person.userId,
              type: 'rejected',
              title: L('note.reject.title'),
              body: L2('note.reject.body', {
                ru: { org: company.name, vacancy: vacancy.title.ru },
                kk: { org: company.name, vacancy: vacancy.title.kk },
              }),
              href: '/p/applications',
            })
          }
          if (side === 'candidate' && company?.userId && person && vacancy) {
            next = addNote(next, {
              userId: company.userId,
              type: 'rejected',
              title: L('note.reject.title'),
              body: L2('note.reject.body', {
                ru: { org: person.fullName, vacancy: vacancy.title.ru },
                kk: { org: person.fullName, vacancy: vacancy.title.kk },
              }),
              href: '/e/candidates',
            })
          }
          return { ...withDerived(next), toast: L('toast.rejected') }
        })
      },
      referTraining: (personId, courseId) => {
        setState((current) => {
          const person = current.people.find((item) => item.id === personId)
          const course = current.courses.find((item) => item.id === courseId)
          const actor = current.users.find((item) => item.id === current.sessionUserId)
          if (!person || !course) return { ...current, toast: L('toast.missing') }
          if (!actor || actor.role !== 'officer' || person.officerId !== actor.id) return { ...current, toast: L('toast.denied') }
          if (person.status === 'employed') return { ...current, toast: L('toast.denied') }
          if (course.status === 'full' || course.seats < 1) return { ...current, toast: L('toast.full') }
          if (current.trainingReferrals.some((item) => item.personId === personId && item.courseId === courseId && item.status !== 'completed')) {
            return { ...current, toast: L('toast.dup') }
          }
          let next: AppState = {
            ...current,
            trainingReferrals: [
              { id: nid('tr'), personId, courseId, status: 'directed', createdAt: nowISO() },
              ...current.trainingReferrals,
            ],
            courses: current.courses.map((item) => {
              if (item.id !== courseId) return item
              const seats = Math.max(0, item.seats - 1)
              return { ...item, seats, status: seats === 0 ? 'full' : item.status }
            }),
          }
          if (person.userId) {
            next = addNote(next, {
              userId: person.userId,
              type: 'training',
              title: L('note.training.title'),
              body: L2('note.training.body', {
                ru: { course: course.title.ru },
                kk: { course: course.title.kk },
              }),
              href: '/p/training',
            })
          }
          for (const userId of watchers(next)) {
            next = addNote(next, {
              userId,
              type: 'training',
              title: L('note.training.officer.title'),
              body: L2('note.training.officer.body', {
                ru: { name: person.fullName, course: course.title.ru },
                kk: { name: person.fullName, course: course.title.kk },
              }),
              href: personHref(next, userId, person.id),
            })
          }
          return { ...withDerived(next), toast: L('toast.training') }
        })
      },
      recordEmployment: (input) => {
        setState((current) => {
          const person = current.people.find((item) => item.id === input.personId)
          const actor = current.users.find((item) => item.id === current.sessionUserId)
          if (!person || !input.organization.trim() || !input.position.ru.trim() || !input.position.kk.trim()) return { ...current, toast: L('toast.required') }
          if (!actor || actor.role !== 'officer' || person.officerId !== actor.id) return { ...current, toast: L('toast.denied') }
          let next = employPerson(current, input)
          for (const userId of watchers(next)) {
            next = addNote(next, {
              userId,
              type: 'accepted',
              title: L('note.hired.title'),
              body: L2('note.hired.body', {
                ru: { name: person.fullName, org: input.organization },
                kk: { name: person.fullName, org: input.organization },
              }),
              href: analyticsHref(next, userId),
            })
          }
          if (person.userId && input.employmentStatus !== 'finished') {
            next = addNote(next, {
              userId: person.userId,
              type: 'accepted',
              title: L('note.accept.title'),
              body: L2('note.accept.body', {
                ru: { org: input.organization, position: input.position.ru },
                kk: { org: input.organization, position: input.position.kk },
              }),
              href: '/p/card',
            })
          }
          return { ...next, toast: L('toast.hired') }
        })
      },
      markAllRead: () => {
        const userId = stateRef.current.sessionUserId
        if (!userId) return
        setState((current) => ({
          ...current,
          notifications: current.notifications.map((item) => (item.userId === userId ? { ...item, read: true } : item)),
        }))
      },
    }
  }, [state, lang])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const value = useContext(StoreContext)
  if (!value) throw new Error('Store missing')
  return value
}

export function flowIndex(status: Person['status'], complete: boolean): number {
  if (!complete) return 0
  if (status === 'employed') return 4
  if (status === 'invited' || status === 'interviewing') return 3
  if (status === 'referred') return 2
  if (status === 'training') return 1
  return 1
}
