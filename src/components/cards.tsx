import { useState, type ReactNode } from 'react'
import { useStore } from '../store'
import type { Course, Vacancy } from '../types'
import { Modal, salaryOf, Score, StatusBadge } from './ui'

export function VacancyFacts({ vacancy, score, reason }: { vacancy: Vacancy; score?: number; reason?: string }) {
  const { state, t, tx, lang } = useStore()
  const employer = state.employers.find((item) => item.id === vacancy.employerId)
  return (
    <div className="vacancy-sheet">
      {typeof score === 'number' ? <Score value={score} /> : null}
      {reason ? <p className="reason">{reason}</p> : null}
      <section>
        <h3>{t('vacancy.about')}</h3>
        <div className="kv">
          <span>{t('common.profession')}</span><b>{t(`profession.${vacancy.profession}`)}</b>
          <span>{t('common.salary')}</span><b>{salaryOf(vacancy.salaryFrom, vacancy.salaryTo, lang)}</b>
          <span>{t('common.schedule')}</span><b>{t(`schedule.${vacancy.schedule}`)}</b>
          <span>{t('common.openings')}</span><b>{vacancy.openings}</b>
          <span>{t('common.status')}</span><b>{t(`vacancyStatus.${vacancy.status}`)}</b>
        </div>
      </section>
      <section>
        <h3>{t('field.requirements')}</h3>
        <div className="kv">
          <span>{t('common.education')}</span><b>{t(`education.${vacancy.education}`)}</b>
          <span>{t('field.experienceYears')}</span><b>{vacancy.experienceYears}</b>
          <span>{t('common.skills')}</span><b>{vacancy.skills.map((id) => t(`skill.${id}`)).join(', ') || '—'}</b>
        </div>
        <p>{tx(vacancy.requirements)}</p>
      </section>
      <section>
        <h3>{t('vacancy.place')}</h3>
        <div className="kv">
          <span>{t('common.organization')}</span><b>{employer?.name ?? '—'}</b>
          <span>{t('field.sphere')}</span><b>{t(`sphere.${vacancy.sphere}`)}</b>
          <span>{t('common.city')}</span><b>{t(`city.${vacancy.city}`)}</b>
          <span>{t('common.district')}</span><b>{t(`district.${vacancy.district}`)}</b>
          <span>{t('common.address')}</span><b>{tx(vacancy.address)}</b>
        </div>
      </section>
      <section>
        <h3>{t('vacancy.contact')}</h3>
        <div className="kv">
          <span>{t('common.contact')}</span><b>{vacancy.contactName}</b>
          <span>{t('common.phone')}</span><b>{vacancy.phone}</b>
        </div>
      </section>
    </div>
  )
}

export function VacancyDialog({
  vacancy,
  score,
  reason,
  onClose,
  children,
}: {
  vacancy: Vacancy
  score?: number
  reason?: string
  onClose: () => void
  children?: ReactNode
}) {
  const { tx } = useStore()
  return (
    <Modal title={tx(vacancy.title)} onClose={onClose} wide>
      <VacancyFacts vacancy={vacancy} score={score} reason={reason} />
      {children ? <div className="btn-row">{children}</div> : null}
    </Modal>
  )
}

export function VacancyCard({
  vacancy,
  score,
  reason,
  children,
}: {
  vacancy: Vacancy
  score?: number
  reason?: string
  children?: ReactNode
}) {
  const { state, t, tx, lang } = useStore()
  const [open, setOpen] = useState(false)
  const employer = state.employers.find((item) => item.id === vacancy.employerId)
  return (
    <article className="vacancy">
      <div className="page-head">
        <div>
          <h3>
            <button className="text-btn" type="button" onClick={() => setOpen(true)}>{tx(vacancy.title)}</button>
          </h3>
          <p className="meta">
            {employer?.name} · {t(`sphere.${vacancy.sphere}`)} · {t(`city.${vacancy.city}`)}, {t(`district.${vacancy.district}`)}
          </p>
        </div>
        <StatusBadge status={vacancy.status} kind="vacancyStatus" />
      </div>
      {typeof score === 'number' ? <Score value={score} /> : null}
      <p>
        {salaryOf(vacancy.salaryFrom, vacancy.salaryTo, lang)} · {t(`schedule.${vacancy.schedule}`)} · {t(`education.${vacancy.education}`)} · {t('field.experienceYears')}: {vacancy.experienceYears} · {t('common.openings')}: {vacancy.openings}
      </p>
      <p className="meta">{tx(vacancy.address)} · {vacancy.contactName} · {vacancy.phone}</p>
      <p>{tx(vacancy.requirements)}</p>
      {reason ? <p className="reason">{reason}</p> : null}
      <div className="btn-row">
        <button className="btn" type="button" onClick={() => setOpen(true)}>{t('common.details')}</button>
        {children}
      </div>
      {open ? (
        <VacancyDialog vacancy={vacancy} score={score} reason={reason} onClose={() => setOpen(false)}>
          {children}
        </VacancyDialog>
      ) : null}
    </article>
  )
}

export function CourseCard({ course, extra }: { course: Course; extra?: ReactNode }) {
  const { t, tx, lang } = useStore()
  const date = new Date(course.startDate).toLocaleDateString(lang === 'kk' ? 'kk-KZ' : 'ru-KZ')
  return (
    <article className="card">
      <div className="page-head">
        <h3>{tx(course.title)}</h3>
        <StatusBadge status={course.status} kind="courseStatus" />
      </div>
      <p className="meta">{t(`direction.${course.direction}`)}</p>
      <p>{course.organization}</p>
      <p className="meta">
        {t('common.duration')}: {tx(course.duration)} · {t('common.start')}: {date} · {t('common.seats')}: {course.seats}
      </p>
      {extra}
    </article>
  )
}
