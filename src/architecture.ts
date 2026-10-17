/** Planned server boundary. The MVP runs these operations in the browser; a Telegram bot calls the same services. */

export const TELEGRAM_MENU = [
  { id: 'find', icon: '🔎', ru: 'Найти работу', kk: 'Жұмыс табу' },
  { id: 'profile', icon: '📋', ru: 'Моя анкета', kk: 'Менің анкетам' },
  { id: 'applications', icon: '💼', ru: 'Мои заявки', kk: 'Менің өтінімдерім' },
  { id: 'training', icon: '🎓', ru: 'Обучение', kk: 'Оқыту' },
  { id: 'nearby', icon: '📍', ru: 'Вакансии рядом', kk: 'Маңайдағы бос орындар' },
  { id: 'help', icon: '💬', ru: 'Помощь', kk: 'Көмек' },
] as const

export const API_ENDPOINTS = [
  'POST /api/auth/register',
  'POST /api/auth/login',
  'GET /api/profile',
  'PUT /api/profile',
  'GET /api/vacancies',
  'GET /api/matches/:personId',
  'POST /api/applications',
  'GET /api/applications',
  'POST /api/applications/:id/invite',
  'POST /api/applications/:id/accept',
  'POST /api/applications/:id/reject',
  'GET /api/training',
  'POST /api/training/refer',
  'GET /api/notifications',
  'POST /api/telegram/webhook',
]

export const DATA_TABLES = [
  'users',
  'persons',
  'employers',
  'vacancies',
  'applications',
  'training_referrals',
  'employment_records',
  'notifications',
  'telegram_links',
]

export const BOT_FLOWS = [
  { id: 'register', ru: 'Регистрация и привязка chat id', kk: 'Тіркелу және chat id байланыстыру' },
  { id: 'profile', ru: 'Заполнение анкеты по шагам', kk: 'Анкетаны қадаммен толтыру' },
  { id: 'vacancies', ru: 'Просмотр вакансий и вакансий рядом', kk: 'Бос орындарды және маңайдағы орындарды көру' },
  { id: 'match', ru: 'Подбор вакансии тем же алгоритмом, что и на сайте', kk: 'Сайттағыдай алгоритммен бос орын іріктеу' },
  { id: 'apply', ru: 'Отправка заявки работодателю', kk: 'Жұмыс берушіге өтінім жіберу' },
  { id: 'status', ru: 'Статус заявки', kk: 'Өтінім мәртебесі' },
  { id: 'training', ru: 'Информация об обучении', kk: 'Оқыту туралы ақпарат' },
  { id: 'help', ru: 'Консультация по разделам меню', kk: 'Мәзір бөлімдері бойынша консультация' },
]
