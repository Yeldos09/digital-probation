import { DEMO_PASSWORD } from './constants'
import { withDerived } from './domain'
import { yearsRu } from './format'
import { translate } from './i18n'
import { explainMatch } from './matching'
import type {
  AppState,
  Application,
  ApplicationStatus,
  CityId,
  CooperationStatus,
  Course,
  DistrictId,
  EducationId,
  Employer,
  EmploymentRecord,
  Gender,
  Localized,
  NationalStats,
  Person,
  ProfessionId,
  ReasonId,
  ScheduleId,
  SkillId,
  SphereId,
  User,
  Vacancy,
  VacancyStatus,
} from './types'

function locProfession(id: ProfessionId): Localized {
  return { ru: translate('ru', `profession.${id}`), kk: translate('kk', `profession.${id}`) }
}

function experienceText(years: number): Localized {
  if (years <= 0) return { ru: 'Без опыта работы по найму', kk: 'Жалдамалы жұмыс өтілі жоқ' }
  return { ru: `${yearsRu(years)} практического опыта`, kk: `${years} жыл практикалық өтіл` }
}

function requirements(education: EducationId, years: number, skills: SkillId[]): Localized {
  const ruSkills = skills.map((id) => translate('ru', `skill.${id}`)).join(', ')
  const kkSkills = skills.map((id) => translate('kk', `skill.${id}`)).join(', ')
  return {
    ru: `Опыт от ${years} лет. Образование: ${translate('ru', `education.${education}`)}. Навыки: ${ruSkills || 'готовность к обучению на месте'}.`,
    kk: `Өтіл ${years} жылдан. Білім: ${translate('kk', `education.${education}`)}. Дағдылар: ${kkSkills || 'жұмыс орнында үйренуге дайындық'}.`,
  }
}

type PersonInput = {
  id: string
  login: string
  name: string
  age: number
  gender: Gender
  city: CityId
  district: DistrictId
  education: EducationId
  profession: ProfessionId
  years: number
  skills: SkillId[]
  license?: string[]
  desired: ProfessionId
  salary: number
  full?: boolean
  shift?: boolean
  training?: boolean
  specialty?: Localized
  phone: string
}

const PEOPLE: PersonInput[] = [
  { id: 'p1', login: 'arman', name: 'Арман Қайратов', age: 29, gender: 'male', city: 'almaty', district: 'bostandyk', education: 'vocational', profession: 'welder', years: 3, skills: ['welding', 'drawings', 'safety'], desired: 'welder', salary: 250000, phone: '+7 700 000 10 01', specialty: { ru: 'Сварщик ручной дуговой сварки', kk: 'Қолмен доғалы дәнекерлеуші' } },
  { id: 'p2', login: 'erlan', name: 'Ерлан Сәрсенбаев', age: 34, gender: 'male', city: 'almaty', district: 'auezov', education: 'vocational', profession: 'installer', years: 4, skills: ['mounting', 'construction', 'safety', 'tools'], desired: 'installer', salary: 270000, phone: '+7 700 000 10 02' },
  { id: 'p3', login: 'nurlan', name: 'Нұрлан Беков', age: 31, gender: 'male', city: 'almaty', district: 'almaly', education: 'vocational', profession: 'electrician', years: 5, skills: ['electrical', 'equipment', 'safety'], desired: 'electrician', salary: 300000, phone: '+7 700 000 10 03' },
  { id: 'p4', login: 'daniyar', name: 'Данияр Омаров', age: 41, gender: 'male', city: 'astana', district: 'esil', education: 'vocational', profession: 'driver', years: 8, skills: ['driving_c', 'logistics', 'safety'], license: ['B', 'C'], desired: 'driver', salary: 320000, shift: true, phone: '+7 700 000 10 04' },
  { id: 'p5', login: 'aigerim', name: 'Айгерім Төлегенова', age: 27, gender: 'female', city: 'almaty', district: 'medeu', education: 'vocational', profession: 'cook', years: 2, skills: ['cooking', 'safety'], desired: 'cook', salary: 220000, shift: true, phone: '+7 700 000 10 05' },
  { id: 'p6', login: 'marat', name: 'Марат Ибраев', age: 24, gender: 'male', city: 'shymkent', district: 'abai', education: 'secondary', profession: 'helper', years: 0, skills: ['construction', 'loading'], desired: 'helper', salary: 180000, training: true, phone: '+7 700 000 10 06' },
  { id: 'p7', login: 'sergey', name: 'Сергей Волков', age: 45, gender: 'male', city: 'karaganda', district: 'kazybek', education: 'vocational', profession: 'locksmith', years: 12, skills: ['metalwork', 'tools', 'equipment', 'welding'], desired: 'locksmith', salary: 280000, phone: '+7 700 000 10 07' },
  { id: 'p8', login: 'asel', name: 'Әсел Нұрланова', age: 26, gender: 'female', city: 'astana', district: 'saryarka', education: 'secondary', profession: 'warehouse', years: 2, skills: ['warehouse', 'logistics', 'loading'], desired: 'warehouse', salary: 230000, phone: '+7 700 000 10 08' },
  { id: 'p9', login: 'bauyrzhan', name: 'Бауыржан Ахметов', age: 33, gender: 'male', city: 'almaty', district: 'turksib', education: 'vocational', profession: 'builder', years: 6, skills: ['construction', 'mounting', 'tools', 'safety'], desired: 'builder', salary: 300000, phone: '+7 700 000 10 09' },
  { id: 'p10', login: 'kuanysh', name: 'Қуаныш Жұмабаев', age: 23, gender: 'male', city: 'karaganda', district: 'kazybek', education: 'secondary', profession: 'operator', years: 0, skills: ['equipment'], desired: 'operator', salary: 240000, training: true, phone: '+7 700 000 10 10' },
  { id: 'p11', login: 'alina', name: 'Алина Морозова', age: 38, gender: 'female', city: 'almaty', district: 'zhetysu', education: 'secondary', profession: 'utility', years: 1, skills: ['cleaning', 'plumbing'], desired: 'utility', salary: 170000, shift: true, training: true, phone: '+7 700 000 10 11' },
  { id: 'p12', login: 'timur', name: 'Тимур Сапаров', age: 36, gender: 'male', city: 'shymkent', district: 'alfarabi', education: 'vocational', profession: 'painter', years: 7, skills: ['painting', 'construction'], desired: 'painter', salary: 220000, phone: '+7 700 000 10 12' },
  { id: 'p13', login: 'olzhas', name: 'Олжас Кенжебаев', age: 44, gender: 'male', city: 'shymkent', district: 'alfarabi', education: 'secondary', profession: 'tractor', years: 9, skills: ['agriculture', 'driving_c', 'equipment'], license: ['C'], desired: 'tractor', salary: 250000, phone: '+7 700 000 10 13' },
  { id: 'p14', login: 'zhanna', name: 'Жанна Абдуллаева', age: 22, gender: 'female', city: 'almaty', district: 'bostandyk', education: 'secondary', profession: 'courier', years: 1, skills: ['driving_b', 'logistics'], license: ['B'], desired: 'courier', salary: 200000, full: false, shift: true, phone: '+7 700 000 10 14' },
  { id: 'p15', login: 'ruslan', name: 'Руслан Петров', age: 30, gender: 'male', city: 'almaty', district: 'auezov', education: 'secondary', profession: 'loader', years: 2, skills: ['loading', 'warehouse'], desired: 'loader', salary: 190000, shift: true, phone: '+7 700 000 10 15' },
  { id: 'p16', login: 'merey', name: 'Мерей Қасымов', age: 28, gender: 'male', city: 'almaty', district: 'medeu', education: 'vocational', profession: 'welder', years: 1, skills: ['welding', 'safety'], desired: 'welder', salary: 260000, phone: '+7 700 000 10 16' },
  { id: 'p17', login: 'indira', name: 'Индира Смагулова', age: 32, gender: 'female', city: 'shymkent', district: 'abai', education: 'secondary', profession: 'cook', years: 0, skills: ['cooking'], desired: 'cook', salary: 180000, shift: true, training: true, phone: '+7 700 000 10 17' },
  { id: 'p18', login: 'erzhan', name: 'Ержан Мусин', age: 39, gender: 'male', city: 'astana', district: 'esil', education: 'vocational', profession: 'electrician', years: 6, skills: ['electrical', 'safety', 'drawings'], desired: 'electrician', salary: 310000, phone: '+7 700 000 10 18' },
  { id: 'p19', login: 'samat', name: 'Самат Әлиев', age: 47, gender: 'male', city: 'karaganda', district: 'kazybek', education: 'vocational', profession: 'driver', years: 15, skills: ['driving_c', 'driving_e', 'logistics'], license: ['C', 'CE'], desired: 'driver', salary: 340000, phone: '+7 700 000 10 19' },
  { id: 'p20', login: 'laura', name: 'Лаура Бекмұхан', age: 21, gender: 'female', city: 'almaty', district: 'almaly', education: 'secondary', profession: 'helper', years: 0, skills: ['cleaning'], desired: 'helper', salary: 150000, training: true, phone: '+7 700 000 10 20' },
]

type EmployerInput = {
  id: string
  login: string
  name: string
  sphere: SphereId
  city: CityId
  district: DistrictId
  address: Localized
  contact: string
  phone: string
  cooperation: CooperationStatus
}

const EMPLOYER_INPUT: EmployerInput[] = [
  { id: 'e1', login: 'qurylys', name: 'ТОО «Алтын Құрылыс»', sphere: 'construction', city: 'almaty', district: 'bostandyk', address: { ru: 'ул. Абая, 120', kk: 'Абай көшесі, 120' }, contact: 'Берик Аманов', phone: '+7 700 100 00 01', cooperation: 'active' },
  { id: 'e2', login: 'nurmontaj', name: 'ТОО «Нұр Монтаж»', sphere: 'construction', city: 'almaty', district: 'auezov', address: { ru: 'ул. Толе би, 48', kk: 'Төле би көшесі, 48' }, contact: 'Серик Жаксылыков', phone: '+7 700 100 00 02', cooperation: 'active' },
  { id: 'e3', login: 'metal', name: 'АО «Қарағанды Металл»', sphere: 'production', city: 'karaganda', district: 'kazybek', address: { ru: 'пр. Бухар жырау, 15', kk: 'Бұқар жырау даңғылы, 15' }, contact: 'Саят Иманов', phone: '+7 700 100 00 03', cooperation: 'active' },
  { id: 'e4', login: 'agro', name: 'ТОО «Жетісу Агро»', sphere: 'agriculture', city: 'almaty', district: 'zhetysu', address: { ru: 'ул. Рыскулова, 90', kk: 'Рысқұлов көшесі, 90' }, contact: 'Айдар Нурмагамбетов', phone: '+7 700 100 00 04', cooperation: 'active' },
  { id: 'e5', login: 'tazakala', name: 'ГКП «Таза Қала»', sphere: 'utility', city: 'almaty', district: 'almaly', address: { ru: 'ул. Панфилова, 22', kk: 'Панфилов көшесі, 22' }, contact: 'Гульнара Оспанова', phone: '+7 700 100 00 05', cooperation: 'active' },
  { id: 'e6', login: 'dalalog', name: 'ТОО «Дала Логистик»', sphere: 'logistics', city: 'astana', district: 'esil', address: { ru: 'пр. Мәңгілік Ел, 18', kk: 'Мәңгілік Ел даңғылы, 18' }, contact: 'Мадина Есенова', phone: '+7 700 100 00 06', cooperation: 'active' },
  { id: 'e7', login: 'service', name: 'ТОО «Шымкент Сервис»', sphere: 'service', city: 'shymkent', district: 'abai', address: { ru: 'ул. Тауке хана, 7', kk: 'Тәуке хан көшесі, 7' }, contact: 'Ербол Тажибаев', phone: '+7 700 100 00 07', cooperation: 'active' },
  { id: 'e8', login: 'astanaq', name: 'ТОО «Астана Құрылыс»', sphere: 'construction', city: 'astana', district: 'saryarka', address: { ru: 'пр. Қабанбай батыра, 55', kk: 'Қабанбай батыр даңғылы, 55' }, contact: 'Асхат Бериков', phone: '+7 700 100 00 08', cooperation: 'active' },
  { id: 'e9', login: 'electro', name: 'ТОО «ЭлектроСервис KZ»', sphere: 'production', city: 'almaty', district: 'medeu', address: { ru: 'пр. Достык, 100', kk: 'Достық даңғылы, 100' }, contact: 'Виктор Назаров', phone: '+7 700 100 00 09', cooperation: 'active' },
  { id: 'e10', login: 'bereke', name: 'КХ «Береке»', sphere: 'agriculture', city: 'shymkent', district: 'alfarabi', address: { ru: 'ул. Кунаева, 11', kk: 'Қонаев көшесі, 11' }, contact: 'Нурсултан Ахметов', phone: '+7 700 100 00 10', cooperation: 'negotiating' },
  { id: 'e11', login: 'transroute', name: 'ТОО «TransRoute»', sphere: 'logistics', city: 'karaganda', district: 'kazybek', address: { ru: 'ул. Ермекова, 33', kk: 'Ермеков көшесі, 33' }, contact: 'Ольга Ким', phone: '+7 700 100 00 11', cooperation: 'active' },
  { id: 'e12', login: 'ashana', name: 'ТОО «Асхана Дос»', sphere: 'service', city: 'almaty', district: 'bostandyk', address: { ru: 'ул. Гоголя, 70', kk: 'Гоголь көшесі, 70' }, contact: 'Жанна Турсынова', phone: '+7 700 100 00 12', cooperation: 'active' },
  { id: 'e13', login: 'kommunal', name: 'ТОО «Коммунал-Сервис»', sphere: 'utility', city: 'astana', district: 'esil', address: { ru: 'ул. Сығанақ, 4', kk: 'Сығанақ көшесі, 4' }, contact: 'Павел Сергеев', phone: '+7 700 100 00 13', cooperation: 'no_vacancies' },
  { id: 'e14', login: 'skladpro', name: 'ТОО «СкладПро»', sphere: 'logistics', city: 'almaty', district: 'auezov', address: { ru: 'ул. Саина, 16', kk: 'Саин көшесі, 16' }, contact: 'Алия Муканова', phone: '+7 700 100 00 14', cooperation: 'active' },
  { id: 'e15', login: 'zhol', name: 'ТОО «Жол Құрылыс»', sphere: 'construction', city: 'shymkent', district: 'abai', address: { ru: 'ул. Байтурсынова, 9', kk: 'Байтұрсынұлы көшесі, 9' }, contact: 'Рауан Сейтов', phone: '+7 700 100 00 15', cooperation: 'terminated' },
]

type VacancyInput = {
  id: string
  employerId: string
  profession: ProfessionId
  city: CityId
  district: DistrictId
  salaryFrom: number
  salaryTo: number
  schedule: ScheduleId
  education: EducationId
  years: number
  skills: SkillId[]
  openings: number
  status: VacancyStatus
}

const VACANCY_INPUT: VacancyInput[] = [
  { id: 'v1', employerId: 'e1', profession: 'welder', city: 'almaty', district: 'bostandyk', salaryFrom: 280000, salaryTo: 350000, schedule: 'full', education: 'vocational', years: 2, skills: ['welding', 'drawings', 'metalwork'], openings: 2, status: 'active' },
  { id: 'v2', employerId: 'e1', profession: 'installer', city: 'almaty', district: 'auezov', salaryFrom: 250000, salaryTo: 320000, schedule: 'full', education: 'vocational', years: 2, skills: ['mounting', 'construction', 'safety'], openings: 3, status: 'active' },
  { id: 'v3', employerId: 'e1', profession: 'helper', city: 'almaty', district: 'bostandyk', salaryFrom: 180000, salaryTo: 220000, schedule: 'shift', education: 'secondary', years: 0, skills: ['construction', 'loading', 'safety'], openings: 6, status: 'active' },
  { id: 'v4', employerId: 'e2', profession: 'installer', city: 'almaty', district: 'auezov', salaryFrom: 300000, salaryTo: 380000, schedule: 'full', education: 'vocational', years: 3, skills: ['mounting', 'drawings'], openings: 2, status: 'active' },
  { id: 'v5', employerId: 'e2', profession: 'builder', city: 'almaty', district: 'turksib', salaryFrom: 240000, salaryTo: 300000, schedule: 'shift', education: 'vocational', years: 1, skills: ['construction', 'mounting', 'tools'], openings: 4, status: 'active' },
  { id: 'v6', employerId: 'e2', profession: 'painter', city: 'almaty', district: 'almaly', salaryFrom: 200000, salaryTo: 260000, schedule: 'full', education: 'secondary', years: 1, skills: ['painting', 'construction'], openings: 2, status: 'active' },
  { id: 'v7', employerId: 'e3', profession: 'locksmith', city: 'karaganda', district: 'kazybek', salaryFrom: 270000, salaryTo: 340000, schedule: 'full', education: 'vocational', years: 3, skills: ['metalwork', 'tools', 'equipment'], openings: 2, status: 'active' },
  { id: 'v8', employerId: 'e3', profession: 'welder', city: 'karaganda', district: 'kazybek', salaryFrom: 300000, salaryTo: 400000, schedule: 'shift', education: 'vocational', years: 2, skills: ['welding', 'safety', 'metalwork'], openings: 1, status: 'paused' },
  { id: 'v9', employerId: 'e3', profession: 'operator', city: 'karaganda', district: 'kazybek', salaryFrom: 260000, salaryTo: 330000, schedule: 'full', education: 'vocational', years: 2, skills: ['equipment', 'metalwork'], openings: 2, status: 'active' },
  { id: 'v10', employerId: 'e4', profession: 'tractor', city: 'almaty', district: 'zhetysu', salaryFrom: 200000, salaryTo: 280000, schedule: 'full', education: 'secondary', years: 1, skills: ['agriculture', 'driving_c'], openings: 2, status: 'active' },
  { id: 'v11', employerId: 'e4', profession: 'helper', city: 'almaty', district: 'zhetysu', salaryFrom: 150000, salaryTo: 190000, schedule: 'full', education: 'secondary', years: 0, skills: ['agriculture', 'loading'], openings: 5, status: 'active' },
  { id: 'v12', employerId: 'e5', profession: 'utility', city: 'almaty', district: 'almaly', salaryFrom: 170000, salaryTo: 220000, schedule: 'shift', education: 'secondary', years: 0, skills: ['cleaning', 'plumbing', 'tools'], openings: 8, status: 'active' },
  { id: 'v13', employerId: 'e5', profession: 'electrician', city: 'almaty', district: 'almaly', salaryFrom: 280000, salaryTo: 360000, schedule: 'full', education: 'vocational', years: 2, skills: ['electrical', 'safety'], openings: 2, status: 'active' },
  { id: 'v14', employerId: 'e6', profession: 'driver', city: 'astana', district: 'esil', salaryFrom: 300000, salaryTo: 380000, schedule: 'shift', education: 'vocational', years: 2, skills: ['driving_c', 'logistics'], openings: 3, status: 'active' },
  { id: 'v15', employerId: 'e6', profession: 'warehouse', city: 'astana', district: 'esil', salaryFrom: 220000, salaryTo: 280000, schedule: 'full', education: 'secondary', years: 1, skills: ['warehouse', 'loading', 'logistics'], openings: 2, status: 'active' },
  { id: 'v16', employerId: 'e6', profession: 'loader', city: 'astana', district: 'esil', salaryFrom: 180000, salaryTo: 230000, schedule: 'shift', education: 'secondary', years: 0, skills: ['loading', 'warehouse'], openings: 4, status: 'active' },
  { id: 'v17', employerId: 'e7', profession: 'cook', city: 'shymkent', district: 'abai', salaryFrom: 200000, salaryTo: 270000, schedule: 'shift', education: 'vocational', years: 1, skills: ['cooking', 'safety'], openings: 2, status: 'active' },
  { id: 'v18', employerId: 'e7', profession: 'helper', city: 'shymkent', district: 'abai', salaryFrom: 140000, salaryTo: 180000, schedule: 'full', education: 'secondary', years: 0, skills: ['cleaning', 'loading'], openings: 3, status: 'active' },
  { id: 'v19', employerId: 'e8', profession: 'builder', city: 'astana', district: 'saryarka', salaryFrom: 320000, salaryTo: 420000, schedule: 'full', education: 'vocational', years: 2, skills: ['construction', 'mounting', 'safety'], openings: 5, status: 'active' },
  { id: 'v20', employerId: 'e8', profession: 'welder', city: 'astana', district: 'saryarka', salaryFrom: 350000, salaryTo: 450000, schedule: 'shift', education: 'vocational', years: 3, skills: ['welding', 'drawings'], openings: 2, status: 'active' },
  { id: 'v21', employerId: 'e9', profession: 'electrician', city: 'almaty', district: 'medeu', salaryFrom: 290000, salaryTo: 370000, schedule: 'full', education: 'vocational', years: 2, skills: ['electrical', 'equipment', 'safety'], openings: 2, status: 'active' },
  { id: 'v22', employerId: 'e9', profession: 'operator', city: 'almaty', district: 'medeu', salaryFrom: 250000, salaryTo: 320000, schedule: 'full', education: 'vocational', years: 1, skills: ['equipment', 'electrical'], openings: 1, status: 'active' },
  { id: 'v23', employerId: 'e10', profession: 'tractor', city: 'shymkent', district: 'alfarabi', salaryFrom: 220000, salaryTo: 300000, schedule: 'full', education: 'secondary', years: 2, skills: ['agriculture', 'driving_c', 'equipment'], openings: 1, status: 'active' },
  { id: 'v24', employerId: 'e10', profession: 'helper', city: 'shymkent', district: 'alfarabi', salaryFrom: 150000, salaryTo: 200000, schedule: 'full', education: 'secondary', years: 0, skills: ['agriculture', 'tools'], openings: 4, status: 'active' },
  { id: 'v25', employerId: 'e11', profession: 'driver', city: 'karaganda', district: 'kazybek', salaryFrom: 280000, salaryTo: 360000, schedule: 'full', education: 'vocational', years: 3, skills: ['driving_c', 'driving_e', 'logistics'], openings: 2, status: 'active' },
  { id: 'v26', employerId: 'e11', profession: 'courier', city: 'karaganda', district: 'kazybek', salaryFrom: 160000, salaryTo: 220000, schedule: 'flexible', education: 'secondary', years: 0, skills: ['driving_b', 'logistics'], openings: 3, status: 'active' },
  { id: 'v27', employerId: 'e12', profession: 'cook', city: 'almaty', district: 'bostandyk', salaryFrom: 230000, salaryTo: 300000, schedule: 'shift', education: 'vocational', years: 1, skills: ['cooking'], openings: 2, status: 'active' },
  { id: 'v28', employerId: 'e13', profession: 'utility', city: 'astana', district: 'esil', salaryFrom: 190000, salaryTo: 250000, schedule: 'shift', education: 'secondary', years: 1, skills: ['plumbing', 'cleaning', 'tools'], openings: 2, status: 'paused' },
  { id: 'v29', employerId: 'e14', profession: 'warehouse', city: 'almaty', district: 'auezov', salaryFrom: 210000, salaryTo: 270000, schedule: 'full', education: 'secondary', years: 1, skills: ['warehouse', 'logistics', 'loading'], openings: 2, status: 'active' },
  { id: 'v30', employerId: 'e15', profession: 'builder', city: 'shymkent', district: 'abai', salaryFrom: 260000, salaryTo: 340000, schedule: 'full', education: 'vocational', years: 2, skills: ['construction', 'mounting', 'tools'], openings: 0, status: 'closed' },
]

function buildPeople(): { users: User[]; people: Person[] } {
  const users: User[] = []
  const people: Person[] = []
  for (const item of PEOPLE) {
    const userId = `u-${item.id}`
    users.push({
      id: userId,
      role: 'probationer',
      login: item.login,
      password: DEMO_PASSWORD,
      name: item.name,
      personId: item.id,
    })
    people.push({
      id: item.id,
      userId,
      officerId: 'u-officer',
      fullName: item.name,
      age: item.age,
      gender: item.gender,
      district: item.district,
      city: item.city,
      education: item.education,
      specialty: item.specialty ?? locProfession(item.profession),
      profession: item.profession,
      experience: experienceText(item.years),
      experienceYears: item.years,
      skills: item.skills,
      hasLicense: Boolean(item.license?.length),
      licenseCategories: item.license ?? [],
      desiredProfession: item.desired,
      desiredSalary: item.salary,
      fullTime: item.full !== false,
      shiftWork: Boolean(item.shift),
      hasVocationalEducation: item.education !== 'secondary',
      needsTraining: Boolean(item.training),
      phone: item.phone,
      status: 'seeking',
      profileComplete: true,
    })
  }
  return { users, people }
}

function buildEmployers(): { users: User[]; employers: Employer[] } {
  const users: User[] = []
  const employers: Employer[] = []
  for (const item of EMPLOYER_INPUT) {
    const userId = `u-${item.id}`
    users.push({
      id: userId,
      role: 'employer',
      login: item.login,
      password: DEMO_PASSWORD,
      name: item.name,
      employerId: item.id,
    })
    employers.push({
      id: item.id,
      userId,
      name: item.name,
      sphere: item.sphere,
      city: item.city,
      district: item.district,
      address: item.address,
      contactName: item.contact,
      phone: item.phone,
      cooperation: item.cooperation,
    })
  }
  return { users, employers }
}

function buildVacancies(employers: Employer[]): Vacancy[] {
  return VACANCY_INPUT.map((item) => {
    const employer = employers.find((entry) => entry.id === item.employerId)
    if (!employer) throw new Error(item.employerId)
    return {
      id: item.id,
      employerId: item.employerId,
      profession: item.profession,
      title: locProfession(item.profession),
      sphere: employer.sphere,
      address: employer.address,
      district: item.district,
      city: item.city,
      salaryFrom: item.salaryFrom,
      salaryTo: item.salaryTo,
      schedule: item.schedule,
      requirements: requirements(item.education, item.years, item.skills),
      education: item.education,
      experienceYears: item.years,
      skills: item.skills,
      openings: item.openings,
      contactName: employer.contactName,
      phone: employer.phone,
      status: item.status,
    }
  })
}

const courses: Course[] = [
  { id: 'c1', direction: 'welder', title: { ru: 'Сварщик ручной дуговой сварки', kk: 'Қолмен доғалы дәнекерлеуші' }, organization: 'Колледж сервиса и технологий', duration: { ru: '3 месяца', kk: '3 ай' }, startDate: '2026-11-03', seats: 18, status: 'open' },
  { id: 'c2', direction: 'electrician', title: { ru: 'Электромонтёр по обслуживанию оборудования', kk: 'Жабдыққа қызмет көрсететін электрші' }, organization: 'Учебный центр «Кәсіп»', duration: { ru: '2,5 месяца', kk: '2,5 ай' }, startDate: '2026-11-10', seats: 12, status: 'open' },
  { id: 'c3', direction: 'installer', title: { ru: 'Монтажник строительных конструкций', kk: 'Құрылыс конструкцияларын монтаждаушы' }, organization: 'Колледж строительства', duration: { ru: '3 месяца', kk: '3 ай' }, startDate: '2026-11-17', seats: 16, status: 'enrollment' },
  { id: 'c4', direction: 'driver', title: { ru: 'Водитель категории C', kk: 'C санатындағы жүргізуші' }, organization: 'Автошкола «Жол»', duration: { ru: '2 месяца', kk: '2 ай' }, startDate: '2026-10-27', seats: 20, status: 'open' },
  { id: 'c5', direction: 'operator', title: { ru: 'Оператор станков и оборудования', kk: 'Станок пен жабдық операторы' }, organization: 'Учебный цех АО «Қарағанды Металл»', duration: { ru: '2 месяца', kk: '2 ай' }, startDate: '2026-12-01', seats: 10, status: 'open' },
  { id: 'c6', direction: 'construction', title: { ru: 'Каменщик и общестроительные работы', kk: 'Тас қалаушы және жалпы құрылыс жұмыстары' }, organization: 'Колледж строительства', duration: { ru: '4 месяца', kk: '4 ай' }, startDate: '2026-11-24', seats: 22, status: 'open' },
  { id: 'c7', direction: 'cook', title: { ru: 'Повар предприятий питания', kk: 'Тамақтану кәсіпорындарының аспазы' }, organization: 'Колледж сервиса и технологий', duration: { ru: '3 месяца', kk: '3 ай' }, startDate: '2026-11-05', seats: 14, status: 'enrollment' },
  { id: 'c8', direction: 'utility', title: { ru: 'Рабочий коммунального хозяйства', kk: 'Коммуналдық шаруашылық жұмысшысы' }, organization: 'Учебный центр «Таза Қала»', duration: { ru: '1,5 месяца', kk: '1,5 ай' }, startDate: '2026-11-12', seats: 25, status: 'open' },
  { id: 'c9', direction: 'other', title: { ru: 'Слесарь механосборочных работ', kk: 'Механикалық құрастыру слесарі' }, organization: 'Учебный центр «Кәсіп»', duration: { ru: '3 месяца', kk: '3 ай' }, startDate: '2026-12-08', seats: 8, status: 'full' },
  { id: 'c10', direction: 'other', title: { ru: 'Маляр-штукатур', kk: 'Сырлаушы-сылақшы' }, organization: 'Колледж строительства', duration: { ru: '2 месяца', kk: '2 ай' }, startDate: '2026-11-19', seats: 15, status: 'open' },
]

function makeApp(
  people: Person[],
  vacancies: Vacancy[],
  personId: string,
  vacancyId: string,
  status: ApplicationStatus,
  createdAt: string,
  reasonId?: ReasonId,
  comment?: string,
): Application {
  const person = people.find((item) => item.id === personId)
  const vacancy = vacancies.find((item) => item.id === vacancyId)
  if (!person || !vacancy) throw new Error(`${personId}:${vacancyId}`)
  const match = explainMatch(person, vacancy)
  return {
    id: `app-${personId}-${vacancyId}`,
    personId,
    vacancyId,
    employerId: vacancy.employerId,
    status,
    score: match.score,
    reason: match.reason,
    createdAt,
    updatedAt: createdAt,
    reasonId,
    comment,
  }
}

const national: NationalStats = {
  total: 342,
  unemployed: 178,
  employed: 96,
  referred: 45,
  training: 23,
  refusals: 28,
  refusalReasons: [
    { id: 'requirements', count: 9 },
    { id: 'experience', count: 6 },
    { id: 'schedule', count: 4 },
    { id: 'no_contact', count: 3 },
    { id: 'candidate', count: 3 },
    { id: 'closed', count: 2 },
    { id: 'other', count: 1 },
  ],
  monthly: [
    { id: '2026-01', employed: 6 },
    { id: '2026-02', employed: 8 },
    { id: '2026-03', employed: 11 },
    { id: '2026-04', employed: 9 },
    { id: '2026-05', employed: 12 },
    { id: '2026-06', employed: 14 },
    { id: '2026-07', employed: 10 },
    { id: '2026-08', employed: 13 },
    { id: '2026-09', employed: 8 },
    { id: '2026-10', employed: 5 },
  ],
  byProfession: [
    { id: 'welder', count: 48 },
    { id: 'builder', count: 44 },
    { id: 'driver', count: 36 },
    { id: 'installer', count: 32 },
    { id: 'helper', count: 30 },
    { id: 'electrician', count: 28 },
    { id: 'utility', count: 26 },
    { id: 'cook', count: 22 },
    { id: 'operator', count: 20 },
    { id: 'loader', count: 18 },
    { id: 'warehouse', count: 16 },
    { id: 'locksmith', count: 12 },
    { id: 'painter', count: 6 },
    { id: 'courier', count: 4 },
  ],
  byDistrict: [
    { id: 'bostandyk', count: 46 },
    { id: 'auezov', count: 42 },
    { id: 'esil', count: 40 },
    { id: 'almaly', count: 38 },
    { id: 'turksib', count: 32 },
    { id: 'saryarka', count: 30 },
    { id: 'medeu', count: 28 },
    { id: 'abai', count: 26 },
    { id: 'zhetysu', count: 24 },
    { id: 'alfarabi', count: 20 },
    { id: 'kazybek', count: 16 },
  ],
}

export const FEATURED_LOGINS = ['arman', 'qurylys', 'officer', 'admin']

export function createSeedState(): AppState {
  const builtPeople = buildPeople()
  const builtEmployers = buildEmployers()
  const people = builtPeople.people
  const employers = builtEmployers.employers
  const vacancies = buildVacancies(employers)
  const applications = [
    makeApp(people, vacancies, 'p2', 'v2', 'referred', '2026-10-10T04:00:00.000Z'),
    makeApp(people, vacancies, 'p3', 'v21', 'invited', '2026-10-12T05:10:00.000Z'),
    makeApp(people, vacancies, 'p8', 'v15', 'interviewing', '2026-10-14T06:20:00.000Z'),
    makeApp(people, vacancies, 'p10', 'v9', 'employer_rejected', '2026-10-08T03:40:00.000Z', 'experience', 'Нужен опыт работы на станках от двух лет.'),
    makeApp(people, vacancies, 'p15', 'v29', 'candidate_rejected', '2026-10-06T07:00:00.000Z', 'candidate', 'Кандидат выбрал другой график.'),
    makeApp(people, vacancies, 'p12', 'v6', 'referred', '2026-10-11T08:15:00.000Z'),
    makeApp(people, vacancies, 'p18', 'v13', 'referred', '2026-10-13T09:05:00.000Z'),
    makeApp(people, vacancies, 'p4', 'v14', 'accepted', '2026-09-02T04:30:00.000Z'),
    makeApp(people, vacancies, 'p13', 'v23', 'accepted', '2026-08-18T04:30:00.000Z'),
  ]
  const trainingReferrals = [
    { id: 'tr-p6', personId: 'p6', courseId: 'c6', status: 'directed' as const, createdAt: '2026-10-09T04:00:00.000Z' },
    { id: 'tr-p17', personId: 'p17', courseId: 'c7', status: 'enrolled' as const, createdAt: '2026-10-07T04:00:00.000Z' },
  ]
  const job = (personId: string, vacancyId: string, date: string): EmploymentRecord => {
    const vacancy = vacancies.find((item) => item.id === vacancyId)
    const employer = employers.find((item) => item.id === vacancy?.employerId)
    if (!vacancy || !employer) throw new Error(vacancyId)
    return {
      id: `job-${personId}`,
      personId,
      employerId: employer.id,
      vacancyId,
      organization: employer.name,
      position: vacancy.title,
      date,
      employmentType: vacancy.schedule === 'shift' ? 'shift' : 'full',
      employmentStatus: 'active',
    }
  }
  const employments = [job('p4', 'v14', '2026-09-02'), job('p13', 'v23', '2026-08-18')]
  const arman = people.find((item) => item.id === 'p1')
  const weld = vacancies.find((item) => item.id === 'v1')
  const match = arman && weld ? explainMatch(arman, weld) : null
  const staff: User[] = [
    { id: 'u-officer', role: 'officer', login: 'officer', password: DEMO_PASSWORD, name: 'Айгүл Сейітқазина' },
    { id: 'u-admin', role: 'admin', login: 'admin', password: DEMO_PASSWORD, name: 'Кабинет мониторинга' },
  ]
  const state: AppState = {
    users: [...staff, ...builtPeople.users, ...builtEmployers.users],
    people,
    employers,
    vacancies,
    courses,
    applications,
    trainingReferrals,
    employments,
    notifications: [
      {
        id: 'n1',
        userId: 'u-p1',
        type: 'match',
        title: { ru: translate('ru', 'note.match.title'), kk: translate('kk', 'note.match.title') },
        body: match?.reason ?? { ru: '', kk: '' },
        createdAt: '2026-10-15T06:30:00.000Z',
        read: false,
        href: '/p/matches',
      },
      {
        id: 'n2',
        userId: 'u-e1',
        type: 'referral',
        title: { ru: translate('ru', 'note.refer.emp.title'), kk: translate('kk', 'note.refer.emp.title') },
        body: {
          ru: translate('ru', 'note.refer.emp.body', { name: 'Ерлан Сәрсенбаев', vacancy: translate('ru', 'profession.installer') }),
          kk: translate('kk', 'note.refer.emp.body', { name: 'Ерлан Сәрсенбаев', vacancy: translate('kk', 'profession.installer') }),
        },
        createdAt: '2026-10-10T04:05:00.000Z',
        read: false,
        href: '/e/candidates',
      },
      {
        id: 'n3',
        userId: 'u-p3',
        type: 'invite',
        title: { ru: translate('ru', 'note.invite.title'), kk: translate('kk', 'note.invite.title') },
        body: {
          ru: translate('ru', 'note.invite.body', { org: 'ТОО «ЭлектроСервис KZ»', vacancy: translate('ru', 'profession.electrician') }),
          kk: translate('kk', 'note.invite.body', { org: 'ТОО «ЭлектроСервис KZ»', vacancy: translate('kk', 'profession.electrician') }),
        },
        createdAt: '2026-10-12T05:20:00.000Z',
        read: false,
        href: '/p/applications',
      },
      {
        id: 'n4',
        userId: 'u-p6',
        type: 'training',
        title: { ru: translate('ru', 'note.training.title'), kk: translate('kk', 'note.training.title') },
        body: {
          ru: translate('ru', 'note.training.body', { course: 'Каменщик и общестроительные работы' }),
          kk: translate('kk', 'note.training.body', { course: 'Тас қалаушы және жалпы құрылыс жұмыстары' }),
        },
        createdAt: '2026-10-09T04:10:00.000Z',
        read: true,
        href: '/p/training',
      },
      {
        id: 'n5',
        userId: 'u-officer',
        type: 'system',
        title: { ru: 'Сводка на сегодня', kk: 'Бүгінгі жинақ' },
        body: {
          ru: 'На учёте 20 человек. Двое уже работают, трое направлены работодателям.',
          kk: 'Есепте 20 адам. Екеуі жұмыс істейді, үшеуі жұмыс берушілерге жолданған.',
        },
        createdAt: '2026-10-16T02:00:00.000Z',
        read: false,
        href: '/o',
      },
    ],
    national,
    sessionUserId: null,
    toast: null,
  }
  return withDerived(state)
}
