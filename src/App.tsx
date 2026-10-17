import { useEffect } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { BotPage, TelegramDock } from './components/BotSim'
import { Notices } from './components/Notices'
import { Shell, type NavItem } from './components/Shell'
import { Analytics } from './components/Analytics'
import { homeFor } from './domain'
import { Landing, Login, Register } from './pages/PublicPages'
import { ECandidates, EHome, EOrg, EVacancies, EVacancyForm } from './pages/EmployerPages'
import { PApplications, PCard, PHome, PMatches, PProfile, PTraining, PVacancies } from './pages/ProbationerPages'
import { Directory, OfficerHome, PersonFile, TrainingBoard, VacancyOversight } from './pages/StaffPages'
import { useStore } from './store'
import type { Role } from './types'

function Guard({ role }: { role: Role }) {
  const { user } = useStore()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to={homeFor(user.role)} replace />
  return <Outlet />
}

function Toast() {
  const { state, tx, dismissToast } = useStore()
  if (!state.toast) return null
  return (
    <button className="toast" type="button" onClick={dismissToast}>
      {tx(state.toast)}
    </button>
  )
}

function NavShell({ items }: { items: NavItem[] }) {
  return <Shell items={items} />
}

function PersonShell() {
  const { t } = useStore()
  return (
    <NavShell
      items={[
        { to: '/p', label: t('nav.home'), end: true },
        { to: '/p/profile', label: t('nav.profile') },
        { to: '/p/matches', label: t('nav.matches') },
        { to: '/p/vacancies', label: t('nav.vacancies') },
        { to: '/p/applications', label: t('nav.applications') },
        { to: '/p/training', label: t('nav.training') },
        { to: '/p/card', label: t('nav.card') },
        { to: '/p/notices', label: t('nav.notices') },
      ]}
    />
  )
}

function EmployerShell() {
  const { t } = useStore()
  return (
    <NavShell
      items={[
        { to: '/e', label: t('nav.home'), end: true },
        { to: '/e/org', label: t('nav.org') },
        { to: '/e/vacancies', label: t('nav.vacancies') },
        { to: '/e/candidates', label: t('nav.candidates') },
        { to: '/e/notices', label: t('nav.notices') },
      ]}
    />
  )
}

function OfficerShell() {
  const { t } = useStore()
  return (
    <NavShell
      items={[
        { to: '/o', label: t('nav.people'), end: true },
        { to: '/o/employers', label: t('nav.employers') },
        { to: '/o/training', label: t('nav.training') },
        { to: '/o/analytics', label: t('nav.analytics') },
        { to: '/o/notices', label: t('nav.notices') },
      ]}
    />
  )
}

function AdminShell() {
  const { t } = useStore()
  return (
    <NavShell
      items={[
        { to: '/a', label: t('nav.analytics'), end: true },
        { to: '/a/people', label: t('nav.people') },
        { to: '/a/employers', label: t('nav.employers') },
        { to: '/a/vacancies', label: t('nav.vacancies') },
        { to: '/a/training', label: t('nav.training') },
        { to: '/a/bot', label: t('nav.bot') },
        { to: '/a/notices', label: t('nav.notices') },
      ]}
    />
  )
}

export function App() {
  return (
    <>
      <Title />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/bot" element={<Navigate to="/" replace />} />
        <Route element={<Guard role="probationer" />}>
          <Route path="/p" element={<PersonShell />}>
            <Route index element={<PHome />} />
            <Route path="profile" element={<PProfile />} />
            <Route path="matches" element={<PMatches />} />
            <Route path="vacancies" element={<PVacancies />} />
            <Route path="applications" element={<PApplications />} />
            <Route path="training" element={<PTraining />} />
            <Route path="card" element={<PCard />} />
            <Route path="notices" element={<Notices />} />
          </Route>
        </Route>
        <Route element={<Guard role="employer" />}>
          <Route path="/e" element={<EmployerShell />}>
            <Route index element={<EHome />} />
            <Route path="org" element={<EOrg />} />
            <Route path="vacancies" element={<EVacancies />} />
            <Route path="vacancies/new" element={<EVacancyForm />} />
            <Route path="vacancies/:vacancyId" element={<EVacancyForm />} />
            <Route path="candidates" element={<ECandidates />} />
            <Route path="notices" element={<Notices />} />
          </Route>
        </Route>
        <Route element={<Guard role="officer" />}>
          <Route path="/o" element={<OfficerShell />}>
            <Route index element={<OfficerHome />} />
            <Route path="people/:id" element={<PersonFile />} />
            <Route path="employers" element={<Directory />} />
            <Route path="training" element={<TrainingBoard />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="notices" element={<Notices />} />
          </Route>
        </Route>
        <Route element={<Guard role="admin" />}>
          <Route path="/a" element={<AdminShell />}>
            <Route index element={<Analytics />} />
            <Route path="people" element={<OfficerHome />} />
            <Route path="people/:id" element={<PersonFile />} />
            <Route path="employers" element={<Directory />} />
            <Route path="vacancies" element={<VacancyOversight />} />
            <Route path="training" element={<TrainingBoard />} />
            <Route path="bot" element={<BotPage />} />
            <Route path="notices" element={<Notices />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <TelegramDock />
      <Toast />
    </>
  )
}

function Title() {
  const { lang } = useStore()
  useEffect(() => {
    document.documentElement.lang = lang
    document.title = lang === 'kk'
      ? 'DIGITAL PROBATION — Кедергісіз жұмыспен қамту'
      : 'DIGITAL PROBATION — Трудоустройство без барьеров'
  }, [lang])
  return null
}
