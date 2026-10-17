import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CITIES, DISTRICTS_BY_CITY, EDUCATIONS, PROFESSIONS, SCHEDULES, SKILLS, SPHERES } from '../constants'
import { nid } from '../format'
import { explainMatch } from '../matching'
import { translate } from '../i18n'
import { useStore } from '../store'
import type { CityId, CooperationStatus, DistrictId, EducationId, Employer, ProfessionId, ReasonId, ScheduleId, SkillId, SphereId, Vacancy, VacancyStatus } from '../types'
import { REASONS } from '../constants'
import { VacancyCard, VacancyDialog } from '../components/cards'
import { Field, Modal, MultiChips, PageHeader, StatusBadge } from '../components/ui'

export function EHome() {
  const { employer, state, t } = useStore()
  if (!employer) return null
  const vacancies = state.vacancies.filter((item) => item.employerId === employer.id)
  const incoming = state.applications.filter((item) => item.employerId === employer.id && (item.status === 'referred' || item.status === 'invited' || item.status === 'interviewing'))
  return (
    <div className="page">
      <PageHeader title={employer.name} text={t('employer.lead')}>
        <Link className="btn primary" to="/e/vacancies/new">{t('action.createVacancy')}</Link>
      </PageHeader>
      <section className="stats">
        <article className="stat"><span>{t('dash.vacancies')}</span><b>{vacancies.filter((item) => item.status === 'active').length}</b></article>
        <article className="stat"><span>{t('employer.pending')}</span><b>{incoming.length}</b></article>
        <article className="stat"><span>{t('common.status')}</span><b style={{ fontSize: 18 }}>{t(`coop.${employer.cooperation}`)}</b></article>
      </section>
      <h2>{t('employer.pending')}</h2>
      {incoming.length === 0 ? <p className="card">{t('application.empty')}</p> : (
        <div className="stack">
          {incoming.slice(0, 4).map((item) => {
            const person = state.people.find((entry) => entry.id === item.personId)
            const vacancy = state.vacancies.find((entry) => entry.id === item.vacancyId)
            return <p className="card" key={item.id}>{person?.fullName} · {vacancy ? t(`profession.${vacancy.profession}`) : ''} · {item.score}%</p>
          })}
        </div>
      )}
      <Link className="btn" to="/e/candidates">{t('nav.candidates')}</Link>
    </div>
  )
}

export function EOrg() {
  const { employer, t, lang, saveEmployer } = useStore()
  const [form, setForm] = useState(employer)
  if (!employer || !form) return null
  return (
    <form className="page" onSubmit={(event) => { event.preventDefault(); saveEmployer(employer.id, form) }}>
      <PageHeader title={t('nav.org')} />
      <div className="card form-grid">
        <Field label={t('field.org')} wide><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></Field>
        <Field label={t('field.sphere')}>
          <select value={form.sphere} onChange={(event) => setForm({ ...form, sphere: event.target.value as SphereId })}>
            {SPHERES.map((id) => <option key={id} value={id}>{t(`sphere.${id}`)}</option>)}
          </select>
        </Field>
        <Field label={t('field.cooperation')}>
          <select value={form.cooperation} onChange={(event) => setForm({ ...form, cooperation: event.target.value as CooperationStatus })}>
            {(['active', 'no_vacancies', 'negotiating', 'terminated'] as CooperationStatus[]).map((id) => <option key={id} value={id}>{t(`coop.${id}`)}</option>)}
          </select>
        </Field>
        <Field label={t('field.city')}>
          <select value={form.city} onChange={(event) => {
            const city = event.target.value as CityId
            setForm({ ...form, city, district: DISTRICTS_BY_CITY[city].includes(form.district) ? form.district : DISTRICTS_BY_CITY[city][0] })
          }}>
            {CITIES.map((id) => <option key={id} value={id}>{t(`city.${id}`)}</option>)}
          </select>
        </Field>
        <Field label={t('field.district')}>
          <select value={form.district} onChange={(event) => setForm({ ...form, district: event.target.value as DistrictId })}>
            {DISTRICTS_BY_CITY[form.city].map((id) => <option key={id} value={id}>{t(`district.${id}`)}</option>)}
          </select>
        </Field>
        <Field label={t('field.address')} wide><input value={form.address[lang]} onChange={(event) => setForm({ ...form, address: { ...form.address, [lang]: event.target.value } })} /></Field>
        <Field label={t('field.contact')}><input value={form.contactName} onChange={(event) => setForm({ ...form, contactName: event.target.value })} /></Field>
        <Field label={t('field.phone')}><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field>
        <button className="btn primary" type="submit">{t('action.save')}</button>
      </div>
    </form>
  )
}

export function EVacancies() {
  const { employer, state, t, tx } = useStore()
  const [openedId, setOpenedId] = useState<string | null>(null)
  const items = state.vacancies.filter((item) => item.employerId === employer?.id)
  const opened = items.find((item) => item.id === openedId) ?? null
  return (
    <div className="page">
      <PageHeader title={t('employer.own')}>
        <Link className="btn primary" to="/e/vacancies/new">{t('action.createVacancy')}</Link>
      </PageHeader>
      <div className="stack">
        {items.map((item) => (
          <article className="card" key={item.id}>
            <div className="page-head">
              <h3>{tx(item.title)}</h3>
              <StatusBadge status={item.status} kind="vacancyStatus" />
            </div>
            <p className="meta">{t(`district.${item.district}`)} · {item.openings} {t('common.places')}</p>
            <div className="btn-row">
              <button className="btn" type="button" onClick={() => setOpenedId(item.id)}>{t('common.details')}</button>
              <Link className="btn" to={`/e/vacancies/${item.id}`}>{t('action.edit')}</Link>
            </div>
          </article>
        ))}
      </div>
      {opened ? <VacancyDialog vacancy={opened} onClose={() => setOpenedId(null)} /> : null}
    </div>
  )
}

function blankVacancy(employer: Employer): Vacancy {
  return {
    id: nid('v'),
    employerId: employer.id,
    profession: 'helper',
    title: { ru: translate('ru', 'profession.helper'), kk: translate('kk', 'profession.helper') },
    sphere: employer.sphere,
    address: employer.address,
    district: employer.district,
    city: employer.city,
    salaryFrom: 180000,
    salaryTo: 240000,
    schedule: 'full',
    requirements: { ru: '', kk: '' },
    education: 'secondary',
    experienceYears: 0,
    skills: [],
    openings: 1,
    contactName: employer.contactName,
    phone: employer.phone,
    status: 'active',
  }
}

export function EVacancyForm() {
  const { vacancyId } = useParams()
  const { employer, state, t, lang, saveVacancy } = useStore()
  const navigate = useNavigate()
  const existing = state.vacancies.find((item) => item.id === vacancyId)
  const [form, setForm] = useState<Vacancy | null>(() => {
    if (!employer) return null
    if (existing && existing.employerId === employer.id) return existing
    if (vacancyId) return null
    return blankVacancy(employer)
  })
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (!employer) return
    if (!vacancyId) {
      setForm(blankVacancy(employer))
      return
    }
    const found = state.vacancies.find((item) => item.id === vacancyId)
    setForm(found && found.employerId === employer.id ? found : null)
  }, [vacancyId])
  if (!employer || !form || (existing && existing.employerId !== employer.id)) return <p className="card">{t('toast.denied')}</p>
  return (
    <form
      className="page"
      onSubmit={(event) => {
        event.preventDefault()
        const title = { ru: translate('ru', `profession.${form.profession}`), kk: translate('kk', `profession.${form.profession}`) }
        const requirements = {
          ru: form.requirements.ru.trim() || `${translate('ru', 'field.requirements')}: ${form.skills.map((id) => translate('ru', `skill.${id}`)).join(', ')}`,
          kk: form.requirements.kk.trim() || `${translate('kk', 'field.requirements')}: ${form.skills.map((id) => translate('kk', `skill.${id}`)).join(', ')}`,
        }
        saveVacancy({ ...form, title, sphere: employer.sphere, requirements })
        navigate('/e/vacancies')
      }}
    >
      <PageHeader title={existing ? t('action.edit') : t('action.createVacancy')} />
      <div className="card form-grid">
        <Field label={t('field.vacancyName')}>
          <select value={form.profession} onChange={(event) => setForm({ ...form, profession: event.target.value as ProfessionId })}>
            {PROFESSIONS.map((id) => <option key={id} value={id}>{t(`profession.${id}`)}</option>)}
          </select>
        </Field>
        <Field label={t('field.vacancyStatus')}>
          <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as VacancyStatus })}>
            {(['active', 'paused', 'closed'] as VacancyStatus[]).map((id) => <option key={id} value={id}>{t(`vacancyStatus.${id}`)}</option>)}
          </select>
        </Field>
        <Field label={t('field.city')}>
          <select value={form.city} onChange={(event) => {
            const city = event.target.value as CityId
            setForm({ ...form, city, district: DISTRICTS_BY_CITY[city].includes(form.district) ? form.district : DISTRICTS_BY_CITY[city][0] })
          }}>
            {CITIES.map((id) => <option key={id} value={id}>{t(`city.${id}`)}</option>)}
          </select>
        </Field>
        <Field label={t('field.district')}>
          <select value={form.district} onChange={(event) => setForm({ ...form, district: event.target.value as DistrictId })}>
            {DISTRICTS_BY_CITY[form.city].map((id) => <option key={id} value={id}>{t(`district.${id}`)}</option>)}
          </select>
        </Field>
        <Field label={t('field.salaryFrom')}><input type="number" value={form.salaryFrom} onChange={(event) => setForm({ ...form, salaryFrom: Number(event.target.value) })} /></Field>
        <Field label={t('field.salaryTo')}><input type="number" value={form.salaryTo} onChange={(event) => setForm({ ...form, salaryTo: Number(event.target.value) })} /></Field>
        <Field label={t('field.schedule')}>
          <select value={form.schedule} onChange={(event) => setForm({ ...form, schedule: event.target.value as ScheduleId })}>
            {SCHEDULES.map((id) => <option key={id} value={id}>{t(`schedule.${id}`)}</option>)}
          </select>
        </Field>
        <Field label={t('field.education')}>
          <select value={form.education} onChange={(event) => setForm({ ...form, education: event.target.value as EducationId })}>
            {EDUCATIONS.map((id) => <option key={id} value={id}>{t(`education.${id}`)}</option>)}
          </select>
        </Field>
        <Field label={t('field.experienceYears')}><input type="number" min={0} value={form.experienceYears} onChange={(event) => setForm({ ...form, experienceYears: Number(event.target.value) })} /></Field>
        <Field label={t('field.openings')}><input type="number" min={0} value={form.openings} onChange={(event) => setForm({ ...form, openings: Number(event.target.value) })} /></Field>
        <Field label={t('field.skills')} wide>
          <MultiChips value={form.skills} options={SKILLS.map((id) => ({ id, label: t(`skill.${id}`) }))} onChange={(skills: SkillId[]) => setForm({ ...form, skills })} />
        </Field>
        <Field label={t('field.requirements')} wide><textarea value={form.requirements[lang]} onChange={(event) => setForm({ ...form, requirements: { ...form.requirements, [lang]: event.target.value } })} /></Field>
        <Field label={t('field.address')} wide><input value={form.address[lang]} onChange={(event) => setForm({ ...form, address: { ...form.address, [lang]: event.target.value } })} /></Field>
        <Field label={t('field.contact')}><input value={form.contactName} onChange={(event) => setForm({ ...form, contactName: event.target.value })} /></Field>
        <Field label={t('field.phone')}><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></Field>
        <button className="btn primary" type="submit">{t('action.save')}</button>
      </div>
    </form>
  )
}

export function ECandidates() {
  const { employer, state, t, lang, moveApplication, acceptApplication, rejectApplication, invitePerson } = useStore()
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [reason, setReason] = useState<ReasonId>('requirements')
  const [comment, setComment] = useState('')
  if (!employer) return null
  const incoming = state.applications.filter((item) => item.employerId === employer.id)
  const vacancies = state.vacancies.filter((item) => item.employerId === employer.id && item.status === 'active')
  return (
    <div className="page">
      <PageHeader title={t('nav.candidates')} text={t('employer.lead')} />
      <h2>{t('employer.pending')}</h2>
      <div className="stack">
        {incoming.map((item) => {
          const person = state.people.find((entry) => entry.id === item.personId)
          const vacancy = state.vacancies.find((entry) => entry.id === item.vacancyId)
          if (!person || !vacancy) return null
          const closed = item.status === 'accepted' || item.status === 'employer_rejected' || item.status === 'candidate_rejected' || person.status === 'employed'
          return (
            <article className="card" key={item.id}>
              <div className="page-head">
                <div>
                  <h3>{person.fullName}, {person.age}</h3>
                  <p className="meta">{t(`profession.${person.profession}`)} · {t(`district.${person.district}`)} · {person.phone}</p>
                </div>
                <StatusBadge status={person.status === 'employed' || item.status === 'accepted' ? 'employed' : item.status} />
              </div>
              <VacancyCard vacancy={vacancy} score={item.score} reason={item.reason[lang]} />
              <p className="meta">{person.skills.map((id) => t(`skill.${id}`)).join(', ')}</p>
              {item.reasonId ? <p>{t('common.reason')}: {t(`reason.${item.reasonId}`)} {item.comment}</p> : null}
              {!closed ? (
                <div className="btn-row">
                  {item.status === 'referred' ? <button className="btn primary" type="button" onClick={() => moveApplication(item.id, 'invited')}>{t('action.invite')}</button> : null}
                  {item.status === 'invited' ? <button className="btn" type="button" onClick={() => moveApplication(item.id, 'interviewing')}>{t('action.interview')}</button> : null}
                  <button className="btn good" type="button" onClick={() => acceptApplication(item.id)}>{t('action.accept')}</button>
                  <button className="btn danger" type="button" onClick={() => setRejectId(item.id)}>{t('action.reject')}</button>
                </div>
              ) : null}
            </article>
          )
        })}
      </div>
      <h2>{t('employer.recommended')}</h2>
      {vacancies.map((vacancy) => {
        const people = state.people
          .filter((item) => item.profileComplete && item.status !== 'employed')
          .map((item) => ({ person: item, ...explainMatch(item, vacancy) }))
          .filter((item) => item.score >= 55)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
        return (
          <section className="stack" key={vacancy.id}>
            <h3>{t(`profession.${vacancy.profession}`)} · {t(`district.${vacancy.district}`)}</h3>
            {people.length === 0 ? <p className="muted">{t('employer.noCandidate')}</p> : null}
            {people.map((item) => {
              const existing = incoming.find((entry) => entry.personId === item.person.id && entry.vacancyId === vacancy.id && entry.status !== 'employer_rejected' && entry.status !== 'candidate_rejected')
              return (
                <article className="card" key={item.person.id}>
                  <b>{item.person.fullName}</b> · {item.score}%
                  <p className="reason">{item.reason[lang]}</p>
                  {!existing ? <button className="btn primary" type="button" onClick={() => invitePerson(item.person.id, vacancy.id)}>{t('action.invite')}</button> : <StatusBadge status={existing.status === 'accepted' ? 'employed' : existing.status} />}
                </article>
              )
            })}
          </section>
        )
      })}
      {rejectId ? (
        <Modal title={t('employer.reasonTitle')} onClose={() => setRejectId(null)}>
          <Field label={t('field.reason')}>
            <select value={reason} onChange={(event) => setReason(event.target.value as ReasonId)}>
              {REASONS.filter((id) => id !== 'candidate').map((id) => <option key={id} value={id}>{t(`reason.${id}`)}</option>)}
            </select>
          </Field>
          <Field label={t('field.comment')}><textarea value={comment} onChange={(event) => setComment(event.target.value)} /></Field>
          <button
            className="btn danger"
            type="button"
            onClick={() => {
              rejectApplication(rejectId, 'employer', reason, comment)
              setRejectId(null)
              setComment('')
            }}
          >
            {t('action.confirmReject')}
          </button>
        </Modal>
      ) : null}
    </div>
  )
}
