import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { formatDateTime } from '../format'
import { useStore } from '../store'
import { PageHeader } from './ui'

export function Notices() {
  const { notices, t, tx, lang, markAllRead } = useStore()
  useEffect(() => {
    if (notices.some((item) => !item.read)) markAllRead()
  }, [notices, markAllRead])
  return (
    <div className="page">
      <PageHeader title={t('notice.title')}>
        <button className="btn" type="button" onClick={markAllRead}>{t('action.markRead')}</button>
      </PageHeader>
      {notices.length === 0 ? <p className="card muted">{t('notice.empty')}</p> : null}
      <div className="card note-list">
        {notices.map((item) => (
          <article key={item.id} className={item.read ? '' : 'unread'}>
            {item.href ? <Link to={item.href}><b>{tx(item.title)}</b></Link> : <b>{tx(item.title)}</b>}
            <p>{tx(item.body)}</p>
            <p className="meta">{formatDateTime(item.createdAt, lang)}{item.read ? '' : ` · ${t('common.new')}`}</p>
          </article>
        ))}
      </div>
    </div>
  )
}
