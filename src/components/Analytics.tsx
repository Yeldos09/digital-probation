import { formatDate, monthLabel } from '../format'
import { countBy, sampleMonths, sampleReasons, sampleSlice } from '../stats'
import { useStore } from '../store'
import type { EmploymentRecord } from '../types'
import { StatusBadge } from './ui'

export function Analytics() {
  const { state, t, lang } = useStore()
  const national = state.national
  const rate = Math.round((national.employed / national.total) * 1000) / 10
  const sample = sampleSlice(state)
  const activeVacancies = state.vacancies.length
  const jobs = [...state.employments].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="page">
      <div>
        <h1>{t('dash.title')}</h1>
        <p className="muted">{t('dash.lead')}</p>
      </div>
      <section className="stats">
        <Kpi label={t('dash.total')} value={national.total} accent />
        <Kpi label={t('dash.unemployed')} value={national.unemployed} />
        <Kpi label={t('dash.employed')} value={national.employed} />
        <Kpi label={t('dash.referred')} value={national.referred} />
        <Kpi label={t('dash.training')} value={national.training} />
        <Kpi label={t('dash.rate')} value={`${rate}%`} />
        <Kpi label={t('dash.vacancies')} value={activeVacancies} />
        <Kpi label={t('dash.employers')} value={state.employers.length} />
        <Kpi label={t('dash.refusals')} value={national.refusals} />
      </section>
      <p className="banner">{t('dash.nationalNote')}</p>
      <div className="grid-2">
        <article className="card">
          <h2>{t('dash.monthly')}</h2>
          <Columns items={national.monthly.map((item) => ({ label: monthLabel(item.id, lang), value: item.employed }))} />
        </article>
        <article className="card">
          <h2>{t('dash.rate')}</h2>
          <Donut value={rate} label={`${national.employed} / ${national.total}`} />
        </article>
      </div>
      <div className="grid-2">
        <article className="card">
          <h2>{t('dash.professions')}</h2>
          <Bars items={national.byProfession.map((item) => ({ label: t(`profession.${item.id}`), value: item.count }))} />
        </article>
        <article className="card">
          <h2>{t('dash.districts')}</h2>
          <Bars items={national.byDistrict.map((item) => ({ label: t(`district.${item.id}`), value: item.count }))} />
        </article>
      </div>
      <article className="card">
        <h2>{t('dash.reasons')}</h2>
        <Bars items={national.refusalReasons.map((item) => ({ label: t(`reason.${item.id}`), value: item.count }))} />
      </article>

      <h2 className="section-title">{t('dash.sample')}</h2>
      <p className="muted">{t('dash.sampleNote')}</p>
      <section className="stats">
        <Kpi label={t('dash.total')} value={sample.total} />
        <Kpi label={t('dash.unemployed')} value={sample.unemployed} />
        <Kpi label={t('dash.employed')} value={sample.employed} />
        <Kpi label={t('dash.referred')} value={sample.referred} />
        <Kpi label={t('dash.training')} value={sample.training} />
        <Kpi label={t('dash.rate')} value={`${sample.rate}%`} />
        <Kpi label={t('dash.refusals')} value={sample.refusals} />
      </section>
      <div className="grid-2">
        <article className="card">
          <h2>{t('dash.monthly')}</h2>
          <Columns items={sampleMonths(state).map((item) => ({ label: monthLabel(item.id, lang), value: item.employed }))} />
        </article>
        <article className="card">
          <h2>{t('dash.professions')}</h2>
          <Bars items={countBy(state.people.map((item) => item.profession)).map((item) => ({ label: t(`profession.${item.id}`), value: item.count }))} />
        </article>
      </div>
      <div className="grid-2">
        <article className="card">
          <h2>{t('dash.districts')}</h2>
          <Bars items={countBy(state.people.map((item) => item.district)).map((item) => ({ label: t(`district.${item.id}`), value: item.count }))} />
        </article>
        <article className="card">
          <h2>{t('dash.reasons')}</h2>
          <Bars items={sampleReasons(state).map((item) => ({ label: t(`reason.${item.id}`), value: item.count }))} />
        </article>
      </div>
      <article className="card">
        <h2>{t('dash.recent')}</h2>
        <JobTable jobs={jobs} />
      </article>
    </div>
  )
}

function Kpi({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <article className={accent ? 'stat accent' : 'stat'}>
      <span>{label}</span>
      <b>{value}</b>
    </article>
  )
}

function Columns({ items }: { items: { label: string; value: number }[] }) {
  const max = Math.max(1, ...items.map((item) => item.value))
  if (items.length === 0) return null
  return (
    <div className="cols" aria-label="chart">
      {items.map((item) => (
        <div className="col" key={item.label}>
          <b>{item.value}</b>
          <div className="col-track">
            <i style={{ height: `${Math.max(8, (item.value / max) * 100)}%` }} />
          </div>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

function Bars({ items }: { items: { label: string; value: number }[] }) {
  const max = Math.max(1, ...items.map((item) => item.value))
  return (
    <div className="bars">
      {items.map((item) => (
        <div className="bar" key={item.label}>
          <span>{item.label}</span>
          <div className="bar-track" aria-hidden>
            <i style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
          <b>{item.value}</b>
        </div>
      ))}
    </div>
  )
}

function Donut({ value, label }: { value: number; label: string }) {
  const radius = 52
  const length = 2 * Math.PI * radius
  const dash = (Math.min(100, value) / 100) * length
  return (
    <div className="donut-wrap">
      <svg className="donut" viewBox="0 0 140 140" role="img" aria-label={`${value}%`}>
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#e6eef5" strokeWidth="14" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="#0c447c"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${length - dash}`}
          transform="rotate(-90 70 70)"
        />
        <text x="70" y="76" textAnchor="middle" fontSize="22" fontWeight="700" fill="#172033">{value}%</text>
      </svg>
      <div>
        <b>{label}</b>
      </div>
    </div>
  )
}

function JobTable({ jobs }: { jobs: EmploymentRecord[] }) {
  const { state, t, tx, lang } = useStore()
  if (jobs.length === 0) return <p className="muted">{t('card.empty')}</p>
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{t('common.person')}</th>
            <th>{t('common.organization')}</th>
            <th>{t('field.position')}</th>
            <th>{t('field.date')}</th>
            <th>{t('field.empType')}</th>
            <th>{t('common.status')}</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => {
            const person = state.people.find((item) => item.id === job.personId)
            return (
              <tr key={job.id}>
                <td>{person?.fullName}</td>
                <td>{job.organization}</td>
                <td>{tx(job.position)}</td>
                <td>{formatDate(job.date, lang)}</td>
                <td><StatusBadge status={job.employmentType} kind="empType" /></td>
                <td><StatusBadge status={job.employmentStatus} kind="empStatus" /></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
