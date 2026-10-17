import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { CITIES, DISTRICTS_BY_CITY, EDUCATIONS, LICENSES, PROFESSIONS, SKILLS } from '../constants'
import { hasOpenApplication, vacancyIsOpen } from '../domain'
import { formatDate, money, yearsRu } from '../format'
import { rankVacancies, suggestedCourses } from '../matching'
import { flowIndex, useStore } from '../store'
import type { CityId, DistrictId, EducationId, ProfessionId, SkillId, Vacancy } from '../types'
import { CourseCard, VacancyCard } from '../components/cards'
import { Field, MultiChips, PageHeader, SingleChips, StatusBadge } from '../components/ui'

export function PHome() {
  const { person, state, t, lang } = useStore()
  if (!person) return null
  const ranked = person.profileComplete ? rankVacancies(person, state.vacancies, state.employers).slice(0, 3) : []
  const step = flowIndex(person.status, person.profileComplete)
  return (
    <div className="page">
      <PageHeader title={t('home.hello', { name: person.fullName })} text={t('home.now')} />
      <div className="page-head">
        <StatusBadge status={person.status} />
        {!person.profileComplete ? <Link className="btn primary" to="/p/profile">{t('home.fill')}</Link> : null}
      </div>
      {!person.profileComplete ? <p className="banner">{t('profile.need')}</p> : null}
      <div className="flow">
        {[1, 2, 3, 4, 5, 6].map((item, index) => (
          <div key={item} className={index < step ? 'done' : index === step ? 'on' : ''}>{t(`flow.${item}`)}</div>
        ))}
      </div>
      <h2>{t('home.top')}</h2>
      <div className="stack">
        {ranked.map((item) => (
          <VacancyCard key={item.vacancy.id} vacancy={item.vacancy} score={item.score} reason={item.reason[lang]}>
            <Link className="btn primary" to="/p/matches">{t('nav.matches')}</Link>
          </VacancyCard>
        ))}
      </div>
      <p className="muted">{lang === 'ru' ? yearsRu(person.experienceYears) : `${person.experienceYears} жыл`} · {money(person.desiredSalary, lang)}</p>
    </div>
  )
}

export function PProfile() {
  const { person, t, lang, saveProfile } = useStore()
  const navigate = useNavigate()
  const [form, setForm] = useState(person)
  if (!person || !form) return null
  const districts = DISTRICTS_BY_CITY[form.city]
  return (
    <form
      className="page"
      onSubmit={(event) => {
        event.preventDefault()
        const next = { ...form, hasLicense: form.hasLicense && form.licenseCategories.length > 0 ? true : form.hasLicense, licenseCategories: form.hasLicense ? form.licenseCategories : [] }
        if (saveProfile(person.id, next)) navigate('/p/matches')
      }}
    >
      <PageHeader title={t('profile.title')} text={t('profile.lead')} />
      <div className="card form-grid">
        <Field label={t('field.fullName')} wide><input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required /></Field>
        <Field label={t('field.age')}><input type="number" min={18} max={80} value={form.age} onChange={(event) => setForm({ ...form, age: Number(event.target.value) })} required /></Field>
        <Field label={t('field.gender')}>
          <SingleChips value={form.gender} options={(['male', 'female'] as const).map((id) => ({ id, label: t(`gender.${id}`) }))} onChange={(gender) => setForm({ ...form, gender })} />
        </Field>
        <Field label={t('field.city')}>
          <select value={form.city} onChange={(event) => {
            const city = event.target.value as CityId
            const nextDistricts = DISTRICTS_BY_CITY[city]
            setForm({ ...form, city, district: nextDistricts.includes(form.district) ? form.district : nextDistricts[0] })
          }}>
            {CITIES.map((city) => <option key={city} value={city}>{t(`city.${city}`)}</option>)}
          </select>
        </Field>
        <Field label={t('field.district')}>
          <select value={form.district} onChange={(event) => setForm({ ...form, district: event.target.value as DistrictId })}>
            {districts.map((district) => <option key={district} value={district}>{t(`district.${district}`)}</option>)}
          </select>
        </Field>
        <Field label={t('field.education')}>
          <SingleChips value={form.education} options={EDUCATIONS.map((id) => ({ id, label: t(`education.${id}`) }))} onChange={(education: EducationId) => setForm({ ...form, education })} />
        </Field>
        <Field label={t('field.specialty')}><input value={form.specialty[lang]} onChange={(event) => setForm({ ...form, specialty: { ...form.specialty, [lang]: event.target.value } })} required /></Field>
        <Field label={t('field.profession')}>
          <select value={form.profession} onChange={(event) => setForm({ ...form, profession: event.target.value as ProfessionId })}>
            {PROFESSIONS.map((id) => <option key={id} value={id}>{t(`profession.${id}`)}</option>)}
          </select>
        </Field>
        <Field label={t('field.experience')} wide><textarea value={form.experience[lang]} onChange={(event) => setForm({ ...form, experience: { ...form.experience, [lang]: event.target.value } })} required /></Field>
        <Field label={t('field.experienceYears')}><input type="number" min={0} max={50} value={form.experienceYears} onChange={(event) => setForm({ ...form, experienceYears: Number(event.target.value) })} /></Field>
        <Field label={t('field.skills')} wide>
          <MultiChips value={form.skills} options={SKILLS.map((id) => ({ id, label: t(`skill.${id}`) }))} onChange={(skills: SkillId[]) => setForm({ ...form, skills })} />
        </Field>
        <Field label={t('field.license')}>
          <SingleChips value={form.hasLicense ? 'yes' : 'no'} options={[{ id: 'yes', label: t('common.yes') }, { id: 'no', label: t('common.no') }]} onChange={(value) => setForm({ ...form, hasLicense: value === 'yes' })} />
        </Field>
        {form.hasLicense ? (
          <Field label={t('field.licenseCats')} wide>
            <MultiChips value={form.licenseCategories} options={LICENSES.map((id) => ({ id, label: id }))} onChange={(licenseCategories) => setForm({ ...form, licenseCategories })} />
          </Field>
        ) : null}
        <Field label={t('field.desired')}>
          <select value={form.desiredProfession} onChange={(event) => setForm({ ...form, desiredProfession: event.target.value as ProfessionId })}>
            {PROFESSIONS.map((id) => <option key={id} value={id}>{t(`profession.${id}`)}</option>)}
          </select>
        </Field>
        <Field label={t('field.salary')}><input type="number" min={50000} step={10000} value={form.desiredSalary} onChange={(event) => setForm({ ...form, desiredSalary: Number(event.target.value) })} /></Field>
        <Field label={t('field.fullTime')}>
          <SingleChips value={form.fullTime ? 'yes' : 'no'} options={[{ id: 'yes', label: t('common.yes') }, { id: 'no', label: t('common.no') }]} onChange={(value) => setForm({ ...form, fullTime: value === 'yes' })} />
        </Field>
        <Field label={t('field.shift')}>
          <SingleChips value={form.shiftWork ? 'yes' : 'no'} options={[{ id: 'yes', label: t('common.yes') }, { id: 'no', label: t('common.no') }]} onChange={(value) => setForm({ ...form, shiftWork: value === 'yes' })} />
        </Field>
        <Field label={t('field.vocational')}>
          <SingleChips value={form.hasVocationalEducation ? 'yes' : 'no'} options={[{ id: 'yes', label: t('common.yes') }, { id: 'no', label: t('common.no') }]} onChange={(value) => setForm({ ...form, hasVocationalEducation: value === 'yes' })} />
        </Field>
        <Field label={t('field.needsTraining')}>
          <SingleChips value={form.needsTraining ? 'yes' : 'no'} options={[{ id: 'yes', label: t('common.yes') }, { id: 'no', label: t('common.no') }]} onChange={(value) => setForm({ ...form, needsTraining: value === 'yes' })} />
        </Field>
        <Field label={t('field.phone')}><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} required /></Field>
        <button className="btn primary" type="submit">{t('action.save')}</button>
      </div>
    </form>
  )
}

export function PMatches() {
  const { person, state, t, lang, refer } = useStore()
  if (!person) return null
  if (!person.profileComplete) {
    return (
      <div className="page">
        <PageHeader title={t('match.title')} text={t('profile.need')} />
        <Link className="btn primary" to="/p/profile">{t('home.fill')}</Link>
      </div>
    )
  }
  const ranked = rankVacancies(person, state.vacancies, state.employers)
  const courses = suggestedCourses(person, state.courses, ranked[0]?.score ?? null)
  return (
    <div className="page">
      <PageHeader title={t('match.title')} text={t('match.lead')} />
      {ranked.length === 0 ? <p className="card">{t('match.empty')}</p> : null}
      {ranked[0] && ranked[0].score < 70 ? <p className="banner">{t('match.weak')}</p> : null}
      <div className="stack">
        {ranked.slice(0, 8).map((item) => {
          const existing = state.applications.find(
            (entry) =>
              entry.personId === person.id &&
              entry.vacancyId === item.vacancy.id &&
              entry.status !== 'employer_rejected' &&
              entry.status !== 'candidate_rejected',
          )
          return (
            <VacancyCard key={item.vacancy.id} vacancy={item.vacancy} score={item.score} reason={item.reason[lang]}>
              {person.status === 'employed' ? null : existing ? (
                <StatusBadge status={existing.status === 'accepted' ? 'employed' : existing.status} />
              ) : (
                <button className="btn primary" type="button" onClick={() => refer(person.id, item.vacancy.id, 'self')}>{t('action.apply')}</button>
              )}
            </VacancyCard>
          )
        })}
      </div>
      {courses.length > 0 ? (
        <>
          <h2>{t('match.train')}</h2>
          <div className="stack">
            {courses.map((course) => {
              const referral = state.trainingReferrals.find((item) => item.personId === person.id && item.courseId === course.id)
              return (
                <CourseCard
                  key={course.id}
                  course={course}
                  extra={referral ? <StatusBadge status={referral.status} kind="trainStatus" /> : null}
                />
              )
            })}
          </div>
        </>
      ) : null}
    </div>
  )
}

export function PVacancies() {
  const { person, state, t, lang, refer } = useStore()
  const [district, setDistrict] = useState('any')
  const [profession, setProfession] = useState('any')
  const [salary, setSalary] = useState('any')
  const [education, setEducation] = useState('any')
  const [experience, setExperience] = useState('any')
  const [schedule, setSchedule] = useState('any')
  const [activeOnly, setActiveOnly] = useState(true)
  const districts = [...new Set(state.vacancies.map((item) => item.district))]
  const items = useMemo(() => {
    return state.vacancies.filter((vacancy) => {
      if (activeOnly && !vacancyIsOpen(vacancy, state.employers)) return false
      if (district !== 'any' && vacancy.district !== district) return false
      if (profession !== 'any' && vacancy.profession !== profession) return false
      if (education !== 'any' && vacancy.education !== education) return false
      if (schedule !== 'any' && vacancy.schedule !== schedule) return false
      if (experience === 'exp0' && vacancy.experienceYears !== 0) return false
      if (experience === 'exp1' && vacancy.experienceYears < 1) return false
      if (experience === 'exp3' && vacancy.experienceYears < 3) return false
      if (!salaryFits(vacancy, salary)) return false
      return true
    })
  }, [state.vacancies, state.employers, activeOnly, district, profession, education, schedule, experience, salary])
  return (
    <div className="page">
      <PageHeader title={t('vacancy.title')} text={t('vacancy.lead')} />
      <div className="filters">
        <select value={district} onChange={(event) => setDistrict(event.target.value)}>
          <option value="any">{t('common.district')}: {t('filter.any')}</option>
          {districts.map((id) => <option key={id} value={id}>{t(`district.${id}`)}</option>)}
        </select>
        <select value={profession} onChange={(event) => setProfession(event.target.value)}>
          <option value="any">{t('common.profession')}: {t('filter.any')}</option>
          {PROFESSIONS.map((id) => <option key={id} value={id}>{t(`profession.${id}`)}</option>)}
        </select>
        <select value={salary} onChange={(event) => setSalary(event.target.value)}>
          <option value="any">{t('common.salary')}: {t('filter.any')}</option>
          <option value="to200">{t('filter.to200')}</option>
          <option value="m200">{t('filter.m200')}</option>
          <option value="m300">{t('filter.m300')}</option>
          <option value="m450">{t('filter.m450')}</option>
        </select>
        <select value={education} onChange={(event) => setEducation(event.target.value)}>
          <option value="any">{t('common.education')}: {t('filter.any')}</option>
          {EDUCATIONS.map((id) => <option key={id} value={id}>{t(`education.${id}`)}</option>)}
        </select>
        <select value={experience} onChange={(event) => setExperience(event.target.value)}>
          <option value="any">{t('common.experience')}: {t('filter.any')}</option>
          <option value="exp0">{t('filter.exp0')}</option>
          <option value="exp1">{t('filter.exp1')}</option>
          <option value="exp3">{t('filter.exp3')}</option>
        </select>
        <select value={schedule} onChange={(event) => setSchedule(event.target.value)}>
          <option value="any">{t('common.schedule')}: {t('filter.any')}</option>
          <option value="full">{t('schedule.full')}</option>
          <option value="shift">{t('schedule.shift')}</option>
          <option value="flexible">{t('schedule.flexible')}</option>
        </select>
        <label className="check"><input type="checkbox" checked={activeOnly} onChange={(event) => setActiveOnly(event.target.checked)} /> {t('filter.active')}</label>
      </div>
      {items.length === 0 ? <p className="card">{t('vacancy.empty')}</p> : null}
      <div className="stack">
        {items.map((vacancy) => {
          const match = person?.profileComplete ? rankVacancies(person, [vacancy], state.employers)[0] : undefined
          return (
            <VacancyCard key={vacancy.id} vacancy={vacancy} score={match?.score} reason={match ? match.reason[lang] : undefined}>
              {person?.profileComplete && person.status !== 'employed' && vacancyIsOpen(vacancy, state.employers) ? (
                hasOpenApplication(state.applications, person.id, vacancy.id) ? (
                  <span className="meta">{t('bot.already')}</span>
                ) : (
                  <button className="btn primary" type="button" onClick={() => refer(person.id, vacancy.id, 'self')}>{t('action.apply')}</button>
                )
              ) : null}
            </VacancyCard>
          )
        })}
      </div>
    </div>
  )
}

function salaryFits(vacancy: Vacancy, salary: string): boolean {
  if (salary === 'any') return true
  const ranges: Record<string, [number, number]> = { to200: [0, 200000], m200: [200000, 300000], m300: [300000, 450000], m450: [450000, 2000000] }
  const range = ranges[salary]
  if (!range) return true
  return vacancy.salaryTo >= range[0] && vacancy.salaryFrom <= range[1]
}

export function PApplications() {
  const { person, state, t, lang, rejectApplication } = useStore()
  if (!person) return null
  const items = state.applications.filter((item) => item.personId === person.id)
  return (
    <div className="page">
      <PageHeader title={t('application.title')} text={t('application.lead')} />
      {items.length === 0 ? <p className="card">{t('application.empty')}</p> : null}
      <div className="stack">
        {items.map((item) => {
          const vacancy = state.vacancies.find((entry) => entry.id === item.vacancyId)
          if (!vacancy) return null
          const open = item.status === 'referred' || item.status === 'invited' || item.status === 'interviewing'
          return (
            <VacancyCard key={item.id} vacancy={vacancy} score={item.score} reason={item.reason[lang]}>
              <StatusBadge status={item.status === 'accepted' ? 'employed' : item.status} />
              {item.comment ? <span className="meta">{item.comment}</span> : null}
              {item.reasonId ? <span className="meta">{t(`reason.${item.reasonId}`)}</span> : null}
              {open && person.status !== 'employed' ? (
                <button className="btn danger" type="button" onClick={() => rejectApplication(item.id, 'candidate', 'candidate', '')}>{t('application.withdraw')}</button>
              ) : null}
            </VacancyCard>
          )
        })}
      </div>
    </div>
  )
}

export function PTraining() {
  const { person, state, t } = useStore()
  const ranked = person?.profileComplete ? rankVacancies(person, state.vacancies, state.employers) : []
  const recommended = person?.profileComplete ? suggestedCourses(person, state.courses, ranked[0]?.score ?? null) : []
  return (
    <div className="page">
      <PageHeader title={t('nav.training')} text={t('training.lead')} />
      {recommended.length > 0 ? <p className="banner">{t('match.train')}</p> : null}
      <div className="stack">
        {state.courses.map((course) => {
          const referral = state.trainingReferrals.find((item) => item.personId === person?.id && item.courseId === course.id)
          return (
            <CourseCard
              key={course.id}
              course={course}
              extra={referral ? <StatusBadge status={referral.status} kind="trainStatus" /> : null}
            />
          )
        })}
      </div>
    </div>
  )
}

export function PCard() {
  const { person, state, t, tx, lang } = useStore()
  const jobs = state.employments.filter((item) => item.personId === person?.id && item.employmentStatus !== 'finished')
  const job = jobs[0]
  return (
    <div className="page">
      <PageHeader title={t('card.title')} text={t('card.lead')}>
        <button className="btn no-print" type="button" onClick={() => window.print()}>{t('common.print')}</button>
      </PageHeader>
      {!job || !person ? <p className="card">{t('card.empty')}</p> : (
        <article className="card">
          <h2>{person.fullName}</h2>
          <div className="kv">
            <span>{t('common.organization')}</span><b>{job.organization}</b>
            <span>{t('field.position')}</span><b>{tx(job.position)}</b>
            <span>{t('field.date')}</span><b>{formatDate(job.date, lang)}</b>
            <span>{t('field.empType')}</span><b>{t(`empType.${job.employmentType}`)}</b>
            <span>{t('field.empStatus')}</span><b>{t(`empStatus.${job.employmentStatus}`)}</b>
            <span>{t('common.status')}</span><b>{t(`status.${person.status}`)}</b>
          </div>
        </article>
      )}
    </div>
  )
}
