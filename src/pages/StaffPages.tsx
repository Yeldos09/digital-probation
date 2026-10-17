import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { vacancyIsOpen } from '../domain'
import { formatDate, todayISO } from '../format'
import { rankVacancies, suggestedCourses } from '../matching'
import { useStore } from '../store'
import type { EmploymentStatus, EmploymentType, Person } from '../types'
import { CourseCard, VacancyCard, VacancyDialog } from '../components/cards'
import { Field, PageHeader, StatusBadge } from '../components/ui'

type Filter = 'all' | 'working' | 'idle' | 'seeking' | 'matched' | 'referred' | 'interview' | 'rejected' | 'training'

const FILTERS: Filter[] = ['all', 'working', 'idle', 'seeking', 'matched', 'referred', 'interview', 'rejected', 'training']

export function OfficerHome() {
  const { state, user, t } = useStore()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const people = state.people.filter((item) => user?.role === 'admin' || item.officerId === user?.id)
  const scored = useMemo(() => people.map((person) => ({
    person,
    top: person.profileComplete ? rankVacancies(person, state.vacancies, state.employers)[0]?.score ?? 0 : 0,
  })), [people, state.vacancies, state.employers])
  const visible = scored.filter(({ person, top }) => {
    if (query && !person.fullName.toLowerCase().includes(query.trim().toLowerCase())) return false
    return pass(person, filter, top)
  })
  return (
    <div className="page">
      <PageHeader title={t('nav.people')} text={t('officer.lead')} />
      <p className="banner">{t('officer.hint')}</p>
      <input className="search" value={query} placeholder={t('common.search')} onChange={(event) => setQuery(event.target.value)} />
      <div className="chips">
        {FILTERS.map((item) => (
          <button key={item} type="button" className={filter === item ? 'chip on' : 'chip'} onClick={() => setFilter(item)}>
            {t(`officer.f.${item}`)}
          </button>
        ))}
      </div>
      {visible.length === 0 ? <p className="card">{t('officer.empty')}</p> : null}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t('field.fullName')}</th>
              <th>{t('common.profession')}</th>
              <th>{t('common.district')}</th>
              <th>{t('common.status')}</th>
              <th>{t('common.score')}</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(({ person, top }) => (
              <tr key={person.id}>
                <td><Link to={`${user?.role === 'admin' ? '/a' : '/o'}/people/${person.id}`}>{person.fullName}</Link></td>
                <td>{t(`profession.${person.profession}`)}</td>
                <td>{t(`district.${person.district}`)}</td>
                <td><StatusBadge status={person.status} /></td>
                <td>{person.profileComplete ? `${top}%` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function pass(person: Person, filter: Filter, top: number): boolean {
  if (filter === 'working') return person.status === 'employed'
  if (filter === 'idle') return person.status !== 'employed'
  if (filter === 'seeking') return person.status === 'seeking'
  if (filter === 'matched') return person.status !== 'employed' && top >= 70
  if (filter === 'referred') return person.status === 'referred'
  if (filter === 'interview') return person.status === 'invited' || person.status === 'interviewing'
  if (filter === 'rejected') return person.status === 'employer_rejected' || person.status === 'candidate_rejected'
  if (filter === 'training') return person.status === 'training'
  return true
}

export function PersonFile() {
  const { id } = useParams()
  const { state, user, t, lang, tx, refer, referTraining, recordEmployment } = useStore()
  const person = state.people.find((item) => item.id === id)
  const [open, setOpen] = useState(false)
  const [org, setOrg] = useState('')
  const [position, setPosition] = useState('')
  const [date, setDate] = useState(todayISO())
  const [kind, setKind] = useState<EmploymentType>('full')
  const [empStatus, setEmpStatus] = useState<EmploymentStatus>('active')
  const [vacancyId, setVacancyId] = useState('')
  if (!person) return <p className="card">{t('toast.missing')}</p>
  const canAct = user?.role === 'officer'
  const ranked = open ? rankVacancies(person, state.vacancies, state.employers).slice(0, 6) : []
  const courses = open ? suggestedCourses(person, state.courses, ranked[0]?.score ?? null) : []
  const apps = state.applications.filter((item) => item.personId === person.id)
  const job = state.employments.find((item) => item.personId === person.id && item.employmentStatus !== 'finished')
  const back = user?.role === 'admin' ? '/a/people' : '/o'
  return (
    <div className="page">
      <Link className="btn small" to={back}>{t('common.back')}</Link>
      <PageHeader title={person.fullName} text={`${person.age} · ${t(`gender.${person.gender}`)} · ${person.phone}`} />
      <StatusBadge status={person.status} />
      <article className="card kv">
        <span>{t('common.city')}</span><b>{t(`city.${person.city}`)}, {t(`district.${person.district}`)}</b>
        <span>{t('field.education')}</span><b>{t(`education.${person.education}`)}</b>
        <span>{t('field.specialty')}</span><b>{tx(person.specialty)}</b>
        <span>{t('common.profession')}</span><b>{t(`profession.${person.profession}`)} → {t(`profession.${person.desiredProfession}`)}</b>
        <span>{t('common.experience')}</span><b>{tx(person.experience)}</b>
        <span>{t('common.skills')}</span><b>{person.skills.map((item) => t(`skill.${item}`)).join(', ') || '—'}</b>
        <span>{t('common.license')}</span><b>{person.hasLicense ? person.licenseCategories.join(', ') : t('common.no')}</b>
        <span>{t('common.salary')}</span><b>{person.desiredSalary.toLocaleString('ru-KZ')} ₸</b>
      </article>
      {job ? (
        <article className="card">
          <h2>{t('card.title')}</h2>
          <p>{job.organization}</p>
          <p>{tx(job.position)} · {formatDate(job.date, lang)} · {t(`empType.${job.employmentType}`)} · {t(`empStatus.${job.employmentStatus}`)}</p>
        </article>
      ) : null}
      {canAct ? (
        <button className="btn primary" type="button" onClick={() => setOpen(true)}>{t('action.match')}</button>
      ) : null}
      {open ? (
        <div className="stack">
          {ranked.map((item) => (
            <VacancyCard key={item.vacancy.id} vacancy={item.vacancy} score={item.score} reason={item.reason[lang]}>
              {person.status === 'employed' ? null : (
                <button className="btn primary" type="button" onClick={() => refer(person.id, item.vacancy.id, 'officer')}>{t('action.refer')}</button>
              )}
            </VacancyCard>
          ))}
          {courses.length > 0 ? <p className="banner">{t('match.train')}</p> : null}
          {courses.map((course) => {
            const referral = state.trainingReferrals.find((item) => item.personId === person.id && item.courseId === course.id && item.status !== 'completed')
            const canSend = person.status !== 'employed' && !referral && course.status !== 'full' && course.seats > 0
            return (
              <CourseCard
                key={course.id}
                course={course}
                extra={
                  referral ? <StatusBadge status={referral.status} kind="trainStatus" /> : canSend ? (
                    <button className="btn" type="button" onClick={() => referTraining(person.id, course.id)}>{t('action.training')}</button>
                  ) : null
                }
              />
            )
          })}
        </div>
      ) : null}
      <h2>{t('officer.history')}</h2>
      <div className="stack">
        {apps.map((item) => {
          const vacancy = state.vacancies.find((entry) => entry.id === item.vacancyId)
          return (
            <p className="card" key={item.id}>
              {vacancy ? tx(vacancy.title) : item.vacancyId} · {item.score}% · {t(`status.${item.status === 'accepted' ? 'employed' : item.status}`)}
              {item.reasonId ? ` · ${t(`reason.${item.reasonId}`)}` : ''}
            </p>
          )
        })}
      </div>
      {canAct ? (
        <form
          className="card form-grid"
          onSubmit={(event) => {
            event.preventDefault()
            const vacancy = state.vacancies.find((item) => item.id === vacancyId)
            const company = state.employers.find((item) => item.id === vacancy?.employerId)
            recordEmployment({
              personId: person.id,
              employerId: company?.id,
              vacancyId: vacancy?.id,
              organization: org || company?.name || '',
              position: vacancy
                ? {
                    ru: (lang === 'ru' ? position : vacancy.title.ru) || position,
                    kk: (lang === 'kk' ? position : vacancy.title.kk) || position,
                  }
                : { ru: position, kk: position },
              date,
              employmentType: kind,
              employmentStatus: empStatus,
            })
          }}
        >
          <h2 className="span-2">{t('officer.recordTitle')}</h2>
          <Field label={t('common.vacancy')} wide>
            <select value={vacancyId} onChange={(event) => {
              const next = event.target.value
              setVacancyId(next)
              const vacancy = state.vacancies.find((item) => item.id === next)
              const company = state.employers.find((item) => item.id === vacancy?.employerId)
              if (vacancy && company) {
                setOrg(company.name)
                setPosition(vacancy.title[lang])
                setKind(vacancy.schedule === 'shift' ? 'shift' : vacancy.schedule === 'flexible' ? 'partial' : 'full')
              }
            }}>
              <option value="">{t('field.manual')}</option>
              {state.vacancies.filter((item) => vacancyIsOpen(item, state.employers)).map((item) => (
                <option key={item.id} value={item.id}>{t(`profession.${item.profession}`)} · {state.employers.find((entry) => entry.id === item.employerId)?.name}</option>
              ))}
            </select>
          </Field>
          <Field label={t('common.organization')}><input value={org} onChange={(event) => setOrg(event.target.value)} required /></Field>
          <Field label={t('field.position')}><input value={position} onChange={(event) => setPosition(event.target.value)} required /></Field>
          <Field label={t('field.date')}><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></Field>
          <Field label={t('field.empType')}>
            <select value={kind} onChange={(event) => setKind(event.target.value as EmploymentType)}>
              {(['full', 'shift', 'partial'] as EmploymentType[]).map((item) => <option key={item} value={item}>{t(`empType.${item}`)}</option>)}
            </select>
          </Field>
          <Field label={t('field.empStatus')}>
            <select value={empStatus} onChange={(event) => setEmpStatus(event.target.value as EmploymentStatus)}>
              {(['active', 'probation', 'finished'] as EmploymentStatus[]).map((item) => <option key={item} value={item}>{t(`empStatus.${item}`)}</option>)}
            </select>
          </Field>
          <button className="btn good" type="submit">{t('action.record')}</button>
        </form>
      ) : null}
    </div>
  )
}

export function Directory() {
  const { state, t, tx } = useStore()
  return (
    <div className="page">
      <PageHeader title={t('directory.title')} text={t('directory.lead')} />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t('common.organization')}</th>
              <th>{t('field.sphere')}</th>
              <th>{t('common.district')}</th>
              <th>{t('common.address')}</th>
              <th>{t('dash.vacancies')}</th>
              <th>{t('common.status')}</th>
            </tr>
          </thead>
          <tbody>
            {state.employers.map((item) => {
              const count = state.vacancies.filter((vacancy) => vacancy.employerId === item.id && vacancyIsOpen(vacancy, state.employers)).length
              return (
                <tr key={item.id}>
                  <td>{item.name}<div className="meta">{item.contactName} · {item.phone}</div></td>
                  <td>{t(`sphere.${item.sphere}`)}</td>
                  <td>{t(`city.${item.city}`)}, {t(`district.${item.district}`)}</td>
                  <td>{tx(item.address)}</td>
                  <td>{count}</td>
                  <td><StatusBadge status={item.cooperation} kind="coop" /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function TrainingBoard() {
  const { state, t } = useStore()
  return (
    <div className="page">
      <PageHeader title={t('nav.training')} />
      <div className="stack">
        {state.courses.map((course) => {
          const count = state.trainingReferrals.filter((item) => item.courseId === course.id).length
          return <CourseCard key={course.id} course={course} extra={<p className="meta">{t('training.count')}: {count}</p>} />
        })}
      </div>
    </div>
  )
}

export function VacancyOversight() {
  const { state, t, tx } = useStore()
  const [openedId, setOpenedId] = useState<string | null>(null)
  const opened = state.vacancies.find((item) => item.id === openedId) ?? null
  return (
    <div className="page">
      <PageHeader title={t('vacancy.title')} text={t('vacancy.lead')} />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t('common.vacancy')}</th>
              <th>{t('common.organization')}</th>
              <th>{t('common.district')}</th>
              <th>{t('common.salary')}</th>
              <th>{t('common.status')}</th>
            </tr>
          </thead>
          <tbody>
            {state.vacancies.map((item) => (
              <tr key={item.id} className="click-row" onClick={() => setOpenedId(item.id)}>
                <td>{tx(item.title)}</td>
                <td>{state.employers.find((entry) => entry.id === item.employerId)?.name}</td>
                <td>{t(`district.${item.district}`)}</td>
                <td>{item.salaryFrom.toLocaleString('ru-KZ')}</td>
                <td><StatusBadge status={item.status} kind="vacancyStatus" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {opened ? <VacancyDialog vacancy={opened} onClose={() => setOpenedId(null)} /> : null}
    </div>
  )
}
