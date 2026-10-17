import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { noticesPath } from '../domain'
import { useStore } from '../store'
import { Brand, LangSwitch } from './ui'

export type NavItem = { to: string; label: string; end?: boolean }

export function Shell({ items }: { items: NavItem[] }) {
  const { user, t, unread, signOut } = useStore()
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => setOpen(false), [location.pathname])

  return (
    <>
      <a className="skip" href="#content">{t('a11y.skip')}</a>
      <header className="topbar">
        <button className="menu-btn" type="button" aria-label={t('common.menu')} onClick={() => setOpen((value) => !value)}>
          {t('common.menu')}
        </button>
        <Brand />
        <div className="spacer" />
        <LangSwitch />
        {user ? (
          <button className="icon-btn" type="button" aria-label={t('a11y.bell')} onClick={() => navigate(noticesPath(user.role))}>
            {t('nav.notices')}
            {unread > 0 ? <span className="dot">{unread}</span> : null}
          </button>
        ) : null}
        <div className="who">
          <b>{user?.name}</b>
          <span>{user ? t(`role.${user.role}`) : ''}</span>
        </div>
        <button
          className="btn small"
          type="button"
          onClick={() => {
            signOut()
            navigate('/')
          }}
        >
          {t('action.logout')}
        </button>
      </header>
      <div className="shell">
        <nav className={open ? 'sidenav open' : 'sidenav'}>
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? 'active' : '')}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <main id="content" className="content">
          <Outlet />
        </main>
      </div>
    </>
  )
}
