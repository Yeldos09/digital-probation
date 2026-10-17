import { useState } from 'react'
import { API_ENDPOINTS, BOT_FLOWS, DATA_TABLES, TELEGRAM_MENU } from '../architecture'
import { CITIES, DISTRICTS_BY_CITY, EDUCATIONS, PROFESSIONS, SKILLS } from '../constants'
import { hasOpenApplication, vacancyIsOpen } from '../domain'
import { yearsRu } from '../format'
import { translate } from '../i18n'
import { rankVacancies, suggestedCourses } from '../matching'
import { useStore } from '../store'
import type { CityId, EducationId, Person, ProfessionId, SkillId } from '../types'
import { VacancyFacts } from './cards'
import { PageHeader } from './ui'

type View = 'menu' | 'find' | 'profile' | 'apps' | 'training' | 'nearby' | 'help' | 'register'

const VIEW: Record<(typeof TELEGRAM_MENU)[number]['id'], View> = {
  find: 'find',
  profile: 'profile',
  applications: 'apps',
  training: 'training',
  nearby: 'nearby',
  help: 'help',
}

export function BotPage() {
  const { t } = useStore()
  return (
    <div className="page">
      <PageHeader title={t('bot.title')} text={t('bot.lead')} />
      <Architecture />
    </div>
  )
}

export function TelegramDock() {
  const { t } = useStore()
  const [open, setOpen] = useState(false)
  return (
    <div className="tg-dock">
      {open ? (
        <section className="tg-panel" role="dialog" aria-label={t('bot.title')}>
          <header className="tg-head">
            <span className="tg-avatar" aria-hidden><TelegramIcon /></span>
            <div>
              <b>Digital Probation</b>
              <small>{t('bot.title')}</small>
            </div>
            <button className="tg-x" type="button" aria-label={t('bot.close')} onClick={() => setOpen(false)}>×</button>
          </header>
          <BotPhone />
        </section>
      ) : null}
      <button className="tg-launcher" type="button" aria-label={open ? t('bot.close') : t('bot.open')} onClick={() => setOpen((value) => !value)}>
        {open ? <CloseIcon /> : <TelegramIcon />}
      </button>
    </div>
  )
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden>
      <path fill="currentColor" d="M21.5 4.4 2.7 11.6c-1.3.5-1.3 1.2-.2 1.5l4.8 1.5 11.1-7c.5-.3 1-.1.6.2l-9 8.1-.3 4.8c.5 0 .7-.2 1-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.2-.5-1.8-1.4-1.5z" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden>
      <path fill="currentColor" d="M6.2 5.2 5.2 6.2 11 12l-5.8 5.8 1 1L12 13l5.8 5.8 1-1L13 12l5.8-5.8-1-1L12 11z" />
    </svg>
  )
}

function BotPhone() {
  const { state, user, t, lang, refer, signUpPerson } = useStore()
  const locked = user?.role === 'probationer' ? user.personId : undefined
  const [personId, setPersonId] = useState(locked ?? 'p1')
  const [view, setView] = useState<View>('menu')
  const person = state.people.find((item) => item.id === (locked ?? personId)) ?? null
  const [form, setForm] = useState({ fullName: '', phone: '+7 700 000 20 00', login: '', password: 'demo123', city: 'almaty' as CityId })

  return (
    <div className="phone">
      <div className="phone-screen">
        <div className="phone-head">
          <b>DIGITAL PROBATION</b>
          <div>{t('bot.sim')}</div>
        </div>
        <div className="phone-body">
          {!locked ? (
            <label className="field">
              <span>{t('bot.bind')}</span>
              <select value={person?.id ?? ''} onChange={(event) => setPersonId(event.target.value)}>
                {state.people.map((item) => (
                  <option key={item.id} value={item.id}>{item.fullName}</option>
                ))}
              </select>
            </label>
          ) : null}
          {view !== 'menu' ? (
            <button className="btn small" type="button" onClick={() => setView('menu')}>{t('common.back')}</button>
          ) : null}
          {view === 'menu' ? (
            <div className="menu-grid">
              {TELEGRAM_MENU.map((item) => (
                <button key={item.id} type="button" onClick={() => setView(VIEW[item.id])}>
                  {item.icon} {item[lang]}
                </button>
              ))}
              <button type="button" onClick={() => setView('register')}>{t('bot.register')}</button>
            </div>
          ) : null}
          {view === 'find' ? <Find person={person} onApply={(id) => person && refer(person.id, id, 'self')} /> : null}
          {view === 'profile' ? <Profile person={person} /> : null}
          {view === 'apps' ? <Apps person={person} /> : null}
          {view === 'training' ? <Learn person={person} /> : null}
          {view === 'nearby' ? <Nearby person={person} /> : null}
          {view === 'help' ? <div className="bubble">{t('bot.helpBody')}</div> : null}
          {view === 'register' ? (
            <form
              className="stack"
              onSubmit={(event) => {
                event.preventDefault()
                const result = signUpPerson(
                  { ...form, district: DISTRICTS_BY_CITY[form.city][0] },
                  false,
                )
                if (result.ok && result.personId) {
                  setPersonId(result.personId)
                  setView('profile')
                }
              }}
            >
              <input placeholder={t('field.fullName')} value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} />
              <input placeholder={t('field.phone')} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
              <select value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value as CityId })}>
                {CITIES.map((city) => <option key={city} value={city}>{t(`city.${city}`)}</option>)}
              </select>
              <input placeholder={t('field.login')} value={form.login} onChange={(event) => setForm({ ...form, login: event.target.value })} />
              <input placeholder={t('field.password')} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
              <button className="btn primary" type="submit">{t('action.register')}</button>
            </form>
          ) : null}
          <p className="meta">{person?.fullName ?? t('bot.pick')}</p>
        </div>
      </div>
    </div>
  )
}

function Find({ person, onApply }: { person: Person | null; onApply: (vacancyId: string) => void }) {
  const { state, t, tx, lang } = useStore()
  const [openedId, setOpenedId] = useState<string | null>(null)
  if (!person?.profileComplete) return <div className="bubble">{t('bot.needProfile')}</div>
  if (person.status === 'employed') return <div className="bubble">{t('bot.employed')}</div>
  const ranked = rankVacancies(person, state.vacancies, state.employers).slice(0, 3)
  if (ranked.length === 0) return <div className="bubble">{t('bot.noMatch')}</div>
  return (
    <div className="stack">
      {ranked.map((item) => {
        const sent = hasOpenApplication(state.applications, person.id, item.vacancy.id)
        return (
          <div className="bubble" key={item.vacancy.id}>
            <b>{tx(item.vacancy.title)} — {item.score}%</b>
            <p>{item.reason[lang]}</p>
            <button className="btn small" type="button" onClick={() => setOpenedId(openedId === item.vacancy.id ? null : item.vacancy.id)}>
              {openedId === item.vacancy.id ? t('common.hide') : t('common.details')}
            </button>
            {openedId === item.vacancy.id ? <VacancyFacts vacancy={item.vacancy} score={item.score} reason={item.reason[lang]} /> : null}
            {sent ? <p>{t('bot.already')}</p> : (
              <button className="btn small primary" type="button" onClick={() => onApply(item.vacancy.id)}>{t('action.apply')}</button>
            )}
          </div>
        )
      })}
    </div>
  )
}

function Profile({ person }: { person: Person | null }) {
  const { state, t, tx } = useStore()
  if (!person) return <div className="bubble">{t('bot.pick')}</div>
  const account = state.users.find((item) => item.personId === person.id)
  if (!person.profileComplete) return <FillProfile person={person} />
  return (
    <div className="bubble">
      <b>{person.fullName}</b>
      <p>{t(`profession.${person.profession}`)} · {t(`district.${person.district}`)}</p>
      <p>{tx(person.experience)}</p>
      <p>{t(`status.${person.status}`)}</p>
      <p>{account?.login}</p>
    </div>
  )
}

function FillProfile({ person }: { person: Person }) {
  const { saveProfile, t } = useStore()
  const [profession, setProfession] = useState<ProfessionId>(person.profession)
  const [education, setEducation] = useState<EducationId>(person.education)
  const [years, setYears] = useState(person.experienceYears)
  const [salary, setSalary] = useState(person.desiredSalary)
  const [age, setAge] = useState(person.age)
  const [fullTime, setFullTime] = useState(person.fullTime)
  const [shiftWork, setShiftWork] = useState(person.shiftWork)
  const [needsTraining, setNeedsTraining] = useState(person.needsTraining)
  const [skills, setSkills] = useState<SkillId[]>(person.skills)
  return (
    <form
      className="stack"
      onSubmit={(event) => {
        event.preventDefault()
        const specialty = {
          ru: translate('ru', `profession.${profession}`),
          kk: translate('kk', `profession.${profession}`),
        }
        const experience = years > 0
          ? { ru: `${yearsRu(years)} практического опыта`, kk: `${years} жыл практикалық өтіл` }
          : { ru: 'Без опыта работы по найму', kk: 'Жалдамалы жұмыс өтілі жоқ' }
        saveProfile(person.id, {
          ...person,
          age,
          profession,
          desiredProfession: profession,
          education,
          specialty,
          experience,
          experienceYears: years,
          desiredSalary: salary,
          fullTime,
          shiftWork,
          needsTraining,
          skills,
          hasVocationalEducation: education !== 'secondary',
          profileComplete: true,
        }, true)
      }}
    >
      <p className="meta">{t('bot.profileEmpty')}</p>
      <select value={profession} onChange={(event) => setProfession(event.target.value as ProfessionId)}>
        {PROFESSIONS.map((id) => <option key={id} value={id}>{t(`profession.${id}`)}</option>)}
      </select>
      <select value={education} onChange={(event) => setEducation(event.target.value as EducationId)}>
        {EDUCATIONS.map((id) => <option key={id} value={id}>{t(`education.${id}`)}</option>)}
      </select>
      <input type="number" min={18} max={80} value={age} onChange={(event) => setAge(Number(event.target.value))} />
      <input type="number" min={0} max={40} value={years} onChange={(event) => setYears(Number(event.target.value))} />
      <input type="number" min={50000} step={10000} value={salary} onChange={(event) => setSalary(Number(event.target.value))} />
      <label className="check"><input type="checkbox" checked={fullTime} onChange={(event) => setFullTime(event.target.checked)} /> {t('field.fullTime')}</label>
      <label className="check"><input type="checkbox" checked={shiftWork} onChange={(event) => setShiftWork(event.target.checked)} /> {t('field.shift')}</label>
      <label className="check"><input type="checkbox" checked={needsTraining} onChange={(event) => setNeedsTraining(event.target.checked)} /> {t('field.needsTraining')}</label>
      <select
        multiple
        value={skills}
        onChange={(event) => setSkills(Array.from(event.target.selectedOptions, (option) => option.value as SkillId))}
      >
        {SKILLS.map((id) => <option key={id} value={id}>{t(`skill.${id}`)}</option>)}
      </select>
      <button className="btn primary" type="submit">{t('bot.finishProfile')}</button>
    </form>
  )
}

function Apps({ person }: { person: Person | null }) {
  const { state, t, tx } = useStore()
  const items = state.applications.filter((item) => item.personId === person?.id)
  if (items.length === 0) return <div className="bubble">{t('bot.noApp')}</div>
  return (
    <div className="stack">
      {items.map((item) => {
        const vacancy = state.vacancies.find((entry) => entry.id === item.vacancyId)
        return (
          <div className="bubble" key={item.id}>
            <b>{vacancy ? tx(vacancy.title) : item.vacancyId}</b>
            <p>{t(`status.${item.status === 'accepted' ? 'employed' : item.status}`)} · {item.score}%</p>
          </div>
        )
      })}
    </div>
  )
}

function Learn({ person }: { person: Person | null }) {
  const { state, t, tx } = useStore()
  const top = person?.profileComplete ? rankVacancies(person, state.vacancies, state.employers)[0]?.score ?? null : null
  const recommended = person?.profileComplete ? suggestedCourses(person, state.courses, top) : []
  const list = recommended.length > 0 ? recommended : state.courses.filter((course) => course.status !== 'full' && course.seats > 0).slice(0, 3)
  return (
    <div className="stack">
      {person?.profileComplete && recommended.length === 0 ? <div className="bubble">{t('bot.trainOk')}</div> : null}
      {recommended.length > 0 ? <div className="bubble">{t('match.train')}</div> : null}
      {list.map((course) => {
        const referral = state.trainingReferrals.find((item) => item.personId === person?.id && item.courseId === course.id)
        return (
          <div className="bubble" key={course.id}>
            <b>{tx(course.title)}</b>
            <p>{course.organization} · {tx(course.duration)}</p>
            {referral ? <p>{t(`trainStatus.${referral.status}`)}</p> : null}
          </div>
        )
      })}
    </div>
  )
}

function Nearby({ person }: { person: Person | null }) {
  const { state, t, tx } = useStore()
  const [openedId, setOpenedId] = useState<string | null>(null)
  if (!person) return <div className="bubble">{t('bot.pick')}</div>
  const open = state.vacancies.filter((item) => vacancyIsOpen(item, state.employers))
  const district = open.filter((item) => item.district === person.district)
  const list = district.length > 0 ? district : open.filter((item) => item.city === person.city)
  return (
    <div className="stack">
      {district.length === 0 ? <div className="bubble">{t('bot.nearbyEmpty')}</div> : null}
      {list.slice(0, 4).map((item) => (
        <div className="bubble" key={item.id}>
          <b>{tx(item.title)}</b>
          <p>{t(`district.${item.district}`)}</p>
          <button className="btn small" type="button" onClick={() => setOpenedId(openedId === item.id ? null : item.id)}>
            {openedId === item.id ? t('common.hide') : t('common.details')}
          </button>
          {openedId === item.id ? <VacancyFacts vacancy={item} /> : null}
        </div>
      ))}
    </div>
  )
}

function Architecture() {
  const { t, lang } = useStore()
  return (
    <div className="stack">
      <article className="card">
        <h2>{t('bot.arch')}</h2>
        <p className="meta">POST /api/telegram/webhook</p>
        <div className="chips">
          {TELEGRAM_MENU.map((item) => <span className="chip" key={item.id}>{item.icon} {item[lang]}</span>)}
        </div>
      </article>
      <article className="card">
        <h2>{t('bot.flows')}</h2>
        <ul>{BOT_FLOWS.map((item) => <li key={item.id}>{item[lang]}</li>)}</ul>
      </article>
      <article className="card">
        <h2>{t('bot.endpoints')}</h2>
        <ul>{API_ENDPOINTS.map((item) => <li key={item}><code>{item}</code></li>)}</ul>
      </article>
      <article className="card">
        <h2>{t('bot.tables')}</h2>
        <p>{DATA_TABLES.join(' · ')}</p>
      </article>
    </div>
  )
}

