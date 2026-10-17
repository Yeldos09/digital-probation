import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DEMO_PASSWORD } from '../constants'
import { CITIES, DISTRICTS_BY_CITY, SPHERES } from '../constants'
import { homeFor, vacancyIsOpen } from '../domain'
import { FEATURED_LOGINS } from '../seed'
import { useStore } from '../store'
import type { CityId, DistrictId, SphereId } from '../types'
import { VacancyDialog } from '../components/cards'
import { Field, LangSwitch, Modal } from '../components/ui'

function PortalFrame({ children }: { children: ReactNode }) {
  const { t } = useStore()
  return (
    <div className="portal">
      <aside className="portal-side">
        <Link className="portal-logo" to="/">
          <span className="mark">dp</span>
          <span>
            <b>digital</b>
            <small>probation</small>
          </span>
        </Link>
        <nav>
          <Link to="/">{t('nav.home')}</Link>
          <Link to="/register">{t('action.register')}</Link>
          <Link to="/login">{t('action.login')}</Link>
        </nav>
        <p className="portal-copy">© 2026</p>
      </aside>
      <div className="portal-main">
        <div className="portal-tools">
          <LangSwitch />
          <Link className="btn small primary" to="/login">{t('action.login')}</Link>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Landing() {
  const { state, t, tx, lang, signIn } = useStore()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [openedId, setOpenedId] = useState<string | null>(null)
  const [newsId, setNewsId] = useState<string | null>(null)
  const slogan = lang === 'kk' ? t('subtitleKk') : t('subtitleRu')
  const openVacancies = state.vacancies.filter((item) => vacancyIsOpen(item, state.employers))
  const needle = query.trim().toLowerCase()
  const found = needle
    ? openVacancies.filter((vacancy) => {
        const employer = state.employers.find((item) => item.id === vacancy.employerId)
        const haystack = [
          tx(vacancy.title),
          t(`profession.${vacancy.profession}`),
          t(`district.${vacancy.district}`),
          t(`city.${vacancy.city}`),
          employer?.name ?? '',
        ].join(' ').toLowerCase()
        return haystack.includes(needle)
      }).slice(0, 8)
    : []
  const samples = openVacancies.slice(0, 6)
  const opened = state.vacancies.find((item) => item.id === openedId) ?? null
  const enter = (login: string) => {
    const role = signIn(login, DEMO_PASSWORD)
    if (role) navigate(homeFor(role))
  }
  const services = [
    { role: 'probationer' as const, to: '/register', icon: 'person' },
    { role: 'employer' as const, to: '/register?role=employer', icon: 'work' },
    { role: 'officer' as const, to: '/login', icon: 'badge' },
    { role: 'admin' as const, to: '/login', icon: 'chart' },
  ]
  return (
    <PortalFrame>
      <section className="banner-hero">
        <p className="kicker">{t('brand')}</p>
        <h1>{slogan}</h1>
        <p>{t('landing.lead')}</p>
        <form className="portal-search" onSubmit={(event) => event.preventDefault()}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('landing.search')}
            aria-label={t('landing.search')}
          />
        </form>
      </section>
      {needle ? (
        <section className="portal-block">
          <h2>{t('landing.vacancies')}</h2>
          {found.length === 0 ? <p className="muted">{t('landing.noResult')}</p> : (
            <div className="service-grid">
              {found.map((vacancy) => {
                const employer = state.employers.find((item) => item.id === vacancy.employerId)
                return (
                  <button className="service-card" type="button" key={vacancy.id} onClick={() => setOpenedId(vacancy.id)}>
                    <span className="service-icon"><ServiceIcon name="work" /></span>
                    <span>
                      <b>{tx(vacancy.title)}</b>
                      <small>{employer?.name} · {t(`district.${vacancy.district}`)}</small>
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </section>
      ) : null}
      <section className="portal-block">
        <h2>{t('landing.services')}</h2>
        <div className="service-grid">
          {services.map((item) => (
            <Link className="service-card" to={item.to} key={item.role}>
              <span className="service-icon"><ServiceIcon name={item.icon} /></span>
              <span>
                <b>{t(`role.${item.role}`)}</b>
                <small>{t(`role.${item.role}.text`)}</small>
              </span>
            </Link>
          ))}
        </div>
      </section>
      <NewsDesk onOpen={setNewsId} />
      <section className="portal-block">
        <h2>{t('landing.accounts')}</h2>
        <p className="muted">{t('common.passwordHint')}</p>
        <div className="service-grid">
          {FEATURED_LOGINS.map((login) => {
            const account = state.users.find((item) => item.login === login)
            if (!account) return null
            return (
              <button className="service-card" key={login} type="button" onClick={() => enter(login)}>
                <span className="service-icon"><ServiceIcon name="person" /></span>
                <span>
                  <b>{account.name}</b>
                  <small>{t(`role.${account.role}`)}</small>
                </span>
              </button>
            )
          })}
        </div>
      </section>
      <section className="portal-block">
        <h2>{t('landing.flow')}</h2>
        <div className="steps">
          {[1, 2, 3, 4, 5, 6].map((step) => (
            <article className="step" key={step}>
              <em>0{step}</em>
              <h3>{t(`step.${step}t`)}</h3>
              <p>{t(`step.${step}d`)}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="portal-block">
        <h2>{t('landing.vacancies')}</h2>
        <div className="service-grid">
          {samples.map((vacancy) => {
            const employer = state.employers.find((item) => item.id === vacancy.employerId)
            return (
              <button className="service-card" type="button" key={vacancy.id} onClick={() => setOpenedId(vacancy.id)}>
                <span className="service-icon"><ServiceIcon name="work" /></span>
                <span>
                  <b>{tx(vacancy.title)}</b>
                  <small>{employer?.name} · {t(`district.${vacancy.district}`)}</small>
                </span>
              </button>
            )
          })}
        </div>
      </section>
      <p className="portal-note">{t('common.disclaimer')}</p>
      {opened ? <VacancyDialog vacancy={opened} onClose={() => setOpenedId(null)} /> : null}
      {newsId ? (
        <Modal title={t(`news.${newsId}.title`)} onClose={() => setNewsId(null)} wide>
          <article className="article">
            <NewsCover tone={NEWS.find((item) => item.id === newsId)?.tone ?? 'match'} />
            <div className="news-kicker">
              <span className="news-rubric">{t(`news.${newsId}.rubric`)}</span>
              <time>{t(`news.${newsId}.date`)}</time>
            </div>
            <p className="article-lead">{t(`news.${newsId}.lead`)}</p>
            <p className="news-body">{t(`news.${newsId}.body`)}</p>
          </article>
        </Modal>
      ) : null}
    </PortalFrame>
  )
}

const NEWS = [
  { id: '1', tone: 'match' },
  { id: '2', tone: 'build' },
  { id: '3', tone: 'learn' },
] as const

function NewsDesk({ onOpen }: { onOpen: (id: string) => void }) {
  const { t } = useStore()
  const [lead, ...rest] = NEWS
  return (
    <section className="portal-block news-desk">
      <div className="news-head">
        <h2>{t('landing.news')}</h2>
        <span>{t('news.tape')}</span>
      </div>
      <div className="news-grid">
        <button className="news-feature" type="button" onClick={() => onOpen(lead.id)}>
          <NewsCover tone={lead.tone} />
          <span className="news-copy">
            <span className="news-rubric">{t(`news.${lead.id}.rubric`)}</span>
            <strong>{t(`news.${lead.id}.title`)}</strong>
            <span className="news-lead">{t(`news.${lead.id}.lead`)}</span>
            <span className="news-meta">
              <time>{t(`news.${lead.id}.date`)}</time>
              <em>{t('news.read')}</em>
            </span>
          </span>
        </button>
        <div className="news-side">
          {rest.map((item) => (
            <button className="news-item" type="button" key={item.id} onClick={() => onOpen(item.id)}>
              <NewsCover tone={item.tone} />
              <span className="news-copy">
                <span className="news-rubric">{t(`news.${item.id}.rubric`)}</span>
                <strong>{t(`news.${item.id}.title`)}</strong>
                <span className="news-meta">
                  <time>{t(`news.${item.id}.date`)}</time>
                  <em>{t('news.read')}</em>
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

function NewsCover({ tone }: { tone: 'match' | 'build' | 'learn' }) {
  if (tone === 'build') {
    return (
      <span className="news-cover tone-build" aria-hidden>
        <svg viewBox="0 0 640 320" preserveAspectRatio="xMidYMid slice">
          <rect width="640" height="320" fill="#3e4a57" />
          <rect y="210" width="640" height="110" fill="#d7c4a3" />
          <rect x="70" y="92" width="92" height="128" fill="#f4efe6" />
          <rect x="178" y="48" width="120" height="172" fill="#efe4cf" />
          <rect x="314" y="118" width="78" height="102" fill="#f7f3ea" />
          <rect x="408" y="78" width="150" height="142" fill="#e7d7b8" />
          <g fill="#3e4a57" opacity="0.35">
            <rect x="92" y="112" width="16" height="16" /><rect x="120" y="112" width="16" height="16" />
            <rect x="92" y="140" width="16" height="16" /><rect x="120" y="140" width="16" height="16" />
            <rect x="200" y="74" width="18" height="18" /><rect x="230" y="74" width="18" height="18" /><rect x="260" y="74" width="18" height="18" />
            <rect x="200" y="106" width="18" height="18" /><rect x="230" y="106" width="18" height="18" /><rect x="260" y="106" width="18" height="18" />
            <rect x="430" y="104" width="22" height="16" /><rect x="464" y="104" width="22" height="16" /><rect x="498" y="104" width="22" height="16" />
            <rect x="430" y="132" width="22" height="16" /><rect x="464" y="132" width="22" height="16" /><rect x="498" y="132" width="22" height="16" />
          </g>
        </svg>
      </span>
    )
  }
  if (tone === 'learn') {
    return (
      <span className="news-cover tone-learn" aria-hidden>
        <svg viewBox="0 0 640 320" preserveAspectRatio="xMidYMid slice">
          <rect width="640" height="320" fill="#0f6b4c" />
          <circle cx="520" cy="64" r="110" fill="#ffffff" opacity="0.08" />
          <rect x="64" y="78" width="300" height="168" rx="18" fill="#ffffff" opacity="0.14" />
          <rect x="92" y="108" width="168" height="14" rx="7" fill="#ffffff" />
          <rect x="92" y="138" width="230" height="8" rx="4" fill="#ffffff" opacity="0.55" />
          <rect x="92" y="158" width="200" height="8" rx="4" fill="#ffffff" opacity="0.4" />
          <rect x="92" y="190" width="92" height="24" rx="12" fill="#d8f5e8" />
          <rect x="400" y="96" width="168" height="132" rx="18" fill="#ffffff" opacity="0.12" />
          <rect x="424" y="122" width="120" height="10" rx="5" fill="#ffffff" opacity="0.8" />
          <rect x="424" y="146" width="96" height="8" rx="4" fill="#ffffff" opacity="0.45" />
          <rect x="424" y="168" width="108" height="8" rx="4" fill="#ffffff" opacity="0.35" />
        </svg>
      </span>
    )
  }
  return (
    <span className="news-cover tone-match" aria-hidden>
      <svg viewBox="0 0 640 320" preserveAspectRatio="xMidYMid slice">
        <rect width="640" height="320" fill="#1d4ed8" />
        <circle cx="500" cy="40" r="130" fill="#ffffff" opacity="0.08" />
        <rect x="58" y="64" width="280" height="188" rx="18" fill="#ffffff" opacity="0.14" />
        <rect x="86" y="96" width="150" height="14" rx="7" fill="#ffffff" />
        <rect x="86" y="126" width="210" height="8" rx="4" fill="#ffffff" opacity="0.5" />
        <rect x="86" y="146" width="180" height="8" rx="4" fill="#ffffff" opacity="0.38" />
        <rect x="86" y="184" width="72" height="28" rx="14" fill="#dbe7ff" />
        <rect x="370" y="96" width="210" height="140" rx="18" fill="#ffffff" opacity="0.12" />
        <circle cx="474" cy="166" r="42" fill="none" stroke="#ffffff" strokeWidth="10" opacity="0.85" />
        <circle cx="474" cy="166" r="42" fill="none" stroke="#dbe7ff" strokeWidth="10" strokeDasharray="190 80" strokeLinecap="round" transform="rotate(-90 474 166)" />
      </svg>
    </span>
  )
}

function ServiceIcon({ name }: { name: string }) {
  const common = { viewBox: '0 0 24 24', width: 22, height: 22, fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, 'aria-hidden': true as const }
  if (name === 'work') {
    return <svg {...common}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5h8v2" /></svg>
  }
  if (name === 'badge') {
    return <svg {...common}><circle cx="12" cy="8" r="3" /><path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" /></svg>
  }
  if (name === 'chart') {
    return <svg {...common}><path d="M4 19V5M4 19h16" /><path d="M8 15v-4M12 15V8M16 15v-6" /></svg>
  }
  return <svg {...common}><circle cx="12" cy="8" r="3" /><path d="M5 19c1.5-3 3.5-4.5 7-4.5S17.5 16 19 19" /></svg>
}

export function Login() {
  const { state, t, signIn, resetDemo } = useStore()
  const navigate = useNavigate()
  const [login, setLogin] = useState('arman')
  const [password, setPassword] = useState(DEMO_PASSWORD)
  const submit = (event: FormEvent) => {
    event.preventDefault()
    const role = signIn(login, password)
    if (role) navigate(homeFor(role))
  }
  return (
    <PortalFrame>
      <div className="public">
        <form className="card stack" onSubmit={submit}>
          <h1>{t('login.title')}</h1>
          <p className="muted">{t('login.lead')}</p>
          <Field label={t('field.login')}><input value={login} onChange={(event) => setLogin(event.target.value)} autoComplete="username" /></Field>
          <Field label={t('field.password')}><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" /></Field>
          <button className="btn primary" type="submit">{t('action.login')}</button>
          <p className="muted">{t('common.passwordHint')}</p>
          <p className="muted">{t('login.staffNote')}</p>
        </form>
        <div className="grid-4">
          {FEATURED_LOGINS.map((name) => {
            const account = state.users.find((item) => item.login === name)
            if (!account) return null
            return (
              <button
                className="btn"
                type="button"
                key={name}
                onClick={() => {
                  const role = signIn(name, DEMO_PASSWORD)
                  if (role) navigate(homeFor(role))
                }}
              >
                {account.name}
              </button>
            )
          })}
        </div>
        <details className="card">
          <summary>{t('common.all')}</summary>
          <div className="stack" style={{ marginTop: 12 }}>
            {state.users.map((account) => (
              <button
                className="btn"
                type="button"
                key={account.id}
                onClick={() => {
                  const role = signIn(account.login, account.password)
                  if (role) navigate(homeFor(role))
                }}
              >
                {account.name} · {account.login}
              </button>
            ))}
          </div>
        </details>
        <button className="btn danger" type="button" onClick={resetDemo}>{t('action.resetDemo')}</button>
      </div>
    </PortalFrame>
  )
}

export function Register() {
  const params = new URLSearchParams(window.location.search)
  const { t, signUpPerson, signUpEmployer } = useStore()
  const navigate = useNavigate()
  const [role, setRole] = useState<'probationer' | 'employer'>(params.get('role') === 'employer' ? 'employer' : 'probationer')
  const [person, setPerson] = useState({ fullName: '', phone: '+7 700 000 30 01', city: 'almaty' as CityId, district: 'bostandyk' as DistrictId, login: '', password: 'demo123' })
  const [company, setCompany] = useState({ name: '', sphere: 'construction' as SphereId, city: 'almaty' as CityId, district: 'bostandyk' as DistrictId, address: '', contactName: '', phone: '+7 700 100 30 01', login: '', password: 'demo123' })

  return (
    <PortalFrame>
      <div className="public">
        <div className="card stack">
          <h1>{t('register.title')}</h1>
          <p className="muted">{t('register.lead')}</p>
          <div className="chips">
            <button type="button" className={role === 'probationer' ? 'chip on' : 'chip'} onClick={() => setRole('probationer')}>{t('register.person')}</button>
            <button type="button" className={role === 'employer' ? 'chip on' : 'chip'} onClick={() => setRole('employer')}>{t('register.employer')}</button>
          </div>
          {role === 'probationer' ? (
            <form
              className="form-grid"
              onSubmit={(event) => {
                event.preventDefault()
                const result = signUpPerson(person, true)
                if (result.ok) navigate('/p/profile')
              }}
            >
              <Field label={t('field.fullName')} wide><input value={person.fullName} onChange={(event) => setPerson({ ...person, fullName: event.target.value })} required /></Field>
              <Field label={t('field.phone')}><input value={person.phone} onChange={(event) => setPerson({ ...person, phone: event.target.value })} required /></Field>
              <Field label={t('field.city')}>
                <select value={person.city} onChange={(event) => {
                  const city = event.target.value as CityId
                  setPerson({ ...person, city, district: DISTRICTS_BY_CITY[city][0] })
                }}>
                  {CITIES.map((city) => <option key={city} value={city}>{t(`city.${city}`)}</option>)}
                </select>
              </Field>
              <Field label={t('field.district')}>
                <select value={person.district} onChange={(event) => setPerson({ ...person, district: event.target.value as DistrictId })}>
                  {DISTRICTS_BY_CITY[person.city].map((district) => <option key={district} value={district}>{t(`district.${district}`)}</option>)}
                </select>
              </Field>
              <Field label={t('field.login')}><input value={person.login} onChange={(event) => setPerson({ ...person, login: event.target.value })} required /></Field>
              <Field label={t('field.password')}><input value={person.password} onChange={(event) => setPerson({ ...person, password: event.target.value })} required /></Field>
              <button className="btn primary span-2" type="submit">{t('action.register')}</button>
            </form>
          ) : (
            <form
              className="form-grid"
              onSubmit={(event) => {
                event.preventDefault()
                if (signUpEmployer(company)) navigate('/e')
              }}
            >
              <Field label={t('field.org')} wide><input value={company.name} onChange={(event) => setCompany({ ...company, name: event.target.value })} required /></Field>
              <Field label={t('field.sphere')}>
                <select value={company.sphere} onChange={(event) => setCompany({ ...company, sphere: event.target.value as SphereId })}>
                  {SPHERES.map((sphere) => <option key={sphere} value={sphere}>{t(`sphere.${sphere}`)}</option>)}
                </select>
              </Field>
              <Field label={t('field.contact')}><input value={company.contactName} onChange={(event) => setCompany({ ...company, contactName: event.target.value })} required /></Field>
              <Field label={t('field.city')}>
                <select value={company.city} onChange={(event) => {
                  const city = event.target.value as CityId
                  setCompany({ ...company, city, district: DISTRICTS_BY_CITY[city][0] })
                }}>
                  {CITIES.map((city) => <option key={city} value={city}>{t(`city.${city}`)}</option>)}
                </select>
              </Field>
              <Field label={t('field.district')}>
                <select value={company.district} onChange={(event) => setCompany({ ...company, district: event.target.value as DistrictId })}>
                  {DISTRICTS_BY_CITY[company.city].map((district) => <option key={district} value={district}>{t(`district.${district}`)}</option>)}
                </select>
              </Field>
              <Field label={t('field.address')} wide><input value={company.address} onChange={(event) => setCompany({ ...company, address: event.target.value })} required /></Field>
              <Field label={t('field.phone')}><input value={company.phone} onChange={(event) => setCompany({ ...company, phone: event.target.value })} required /></Field>
              <Field label={t('field.login')}><input value={company.login} onChange={(event) => setCompany({ ...company, login: event.target.value })} required /></Field>
              <Field label={t('field.password')}><input value={company.password} onChange={(event) => setCompany({ ...company, password: event.target.value })} required /></Field>
              <button className="btn primary" type="submit">{t('action.register')}</button>
            </form>
          )}
        </div>
      </div>
    </PortalFrame>
  )
}
