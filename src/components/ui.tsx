import type { ReactNode } from 'react'
import { moneyRange, scoreTone } from '../format'
import { useStore } from '../store'
import type { Lang, Localized } from '../types'

export function Field({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'field span-2' : 'field'}>
      <span>{label}</span>
      {children}
    </div>
  )
}

export function PageHeader({ title, text, children }: { title: string; text?: string; children?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {text ? <p>{text}</p> : null}
      </div>
      {children}
    </div>
  )
}

export function Empty({ text }: { text: string }) {
  return <div className="card muted">{text}</div>
}

export function StatusBadge({ status, kind = 'status' }: { status: string; kind?: string }) {
  const { t } = useStore()
  return <span className={`badge ${status}`}>{t(`${kind}.${status}`)}</span>
}

export function Score({ value }: { value: number }) {
  const tone = scoreTone(value)
  return (
    <div className="score">
      <b className={tone}>{value}%</b>
      <div className="track" aria-hidden>
        <i className={tone} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

export function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const { t } = useStore()
  return (
    <div className="modal-back" onClick={onClose} role="presentation">
      <div className={wide ? 'modal wide' : 'modal'} role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()}>
        <div className="page-head">
          <h2>{title}</h2>
          <button className="btn small" type="button" onClick={onClose}>{t('common.close')}</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function SingleChips<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { id: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div className="chips">
      {options.map((option) => (
        <button key={option.id} type="button" className={option.id === value ? 'chip on' : 'chip'} onClick={() => onChange(option.id)}>
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function MultiChips<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T[]
  options: { id: T; label: string }[]
  onChange: (value: T[]) => void
}) {
  return (
    <div className="chips">
      {options.map((option) => {
        const on = value.includes(option.id)
        return (
          <button
            key={option.id}
            type="button"
            className={on ? 'chip on' : 'chip'}
            onClick={() => onChange(on ? value.filter((item) => item !== option.id) : [...value, option.id])}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export function salaryOf(from: number, to: number, lang: Lang): string {
  return moneyRange(from, to, lang)
}

export function LangSwitch() {
  const { lang, setLang, t } = useStore()
  return (
    <div className="lang" aria-label={t('common.language')}>
      <button type="button" className={lang === 'kk' ? 'on' : ''} onClick={() => setLang('kk')}>Қазақша</button>
      <button type="button" className={lang === 'ru' ? 'on' : ''} onClick={() => setLang('ru')}>Русский</button>
    </div>
  )
}

export function Brand() {
  const { t, lang } = useStore()
  return (
    <div className="brand">
      <div className="mark">DP</div>
      <div>
        <b>{t('brand')}</b>
        <small>{lang === 'kk' ? t('subtitleKk') : t('subtitleRu')}</small>
      </div>
    </div>
  )
}

export function textOf(value: Localized, lang: Lang): string {
  return value[lang]
}
