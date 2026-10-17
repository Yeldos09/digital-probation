export type Lang = 'ru' | 'kk'
export type Localized = { ru: string; kk: string }

export type Role = 'probationer' | 'employer' | 'officer' | 'admin'
export type Gender = 'male' | 'female'
export type EducationId = 'secondary' | 'vocational' | 'higher'
export type ScheduleId = 'full' | 'shift' | 'flexible'

export type PersonStatus =
  | 'seeking'
  | 'referred'
  | 'invited'
  | 'interviewing'
  | 'training'
  | 'employed'
  | 'employer_rejected'
  | 'candidate_rejected'

export type VacancyStatus = 'active' | 'paused' | 'closed'
export type CooperationStatus = 'active' | 'no_vacancies' | 'negotiating' | 'terminated'

export type ApplicationStatus =
  | 'referred'
  | 'invited'
  | 'interviewing'
  | 'accepted'
  | 'employer_rejected'
  | 'candidate_rejected'

export type CourseStatus = 'open' | 'enrollment' | 'full'
export type TrainingStatus = 'directed' | 'enrolled' | 'completed'
export type EmploymentType = 'full' | 'shift' | 'partial'
export type EmploymentStatus = 'active' | 'probation' | 'finished'

export type ProfessionId =
  | 'welder'
  | 'installer'
  | 'electrician'
  | 'driver'
  | 'helper'
  | 'cook'
  | 'operator'
  | 'locksmith'
  | 'warehouse'
  | 'builder'
  | 'courier'
  | 'utility'
  | 'tractor'
  | 'painter'
  | 'loader'

export type SkillId =
  | 'welding'
  | 'drawings'
  | 'safety'
  | 'mounting'
  | 'electrical'
  | 'driving_b'
  | 'driving_c'
  | 'driving_d'
  | 'driving_e'
  | 'cooking'
  | 'warehouse'
  | 'loading'
  | 'cleaning'
  | 'equipment'
  | 'plumbing'
  | 'painting'
  | 'agriculture'
  | 'construction'
  | 'logistics'
  | 'tools'
  | 'metalwork'

export type DistrictId =
  | 'bostandyk'
  | 'auezov'
  | 'almaly'
  | 'medeu'
  | 'turksib'
  | 'zhetysu'
  | 'esil'
  | 'saryarka'
  | 'abai'
  | 'alfarabi'
  | 'kazybek'

export type CityId = 'almaty' | 'astana' | 'shymkent' | 'karaganda'

export type SphereId =
  | 'construction'
  | 'production'
  | 'agriculture'
  | 'service'
  | 'utility'
  | 'logistics'

export type DirectionId =
  | 'welder'
  | 'electrician'
  | 'installer'
  | 'driver'
  | 'operator'
  | 'construction'
  | 'cook'
  | 'utility'
  | 'other'

export type ReasonId =
  | 'requirements'
  | 'experience'
  | 'schedule'
  | 'no_contact'
  | 'closed'
  | 'candidate'
  | 'other'

export interface User {
  id: string
  role: Role
  login: string
  password: string
  name: string
  personId?: string
  employerId?: string
}

export interface Person {
  id: string
  userId?: string
  officerId: string
  fullName: string
  age: number
  gender: Gender
  district: DistrictId
  city: CityId
  education: EducationId
  specialty: Localized
  profession: ProfessionId
  experience: Localized
  experienceYears: number
  skills: SkillId[]
  hasLicense: boolean
  licenseCategories: string[]
  desiredProfession: ProfessionId
  desiredSalary: number
  fullTime: boolean
  shiftWork: boolean
  hasVocationalEducation: boolean
  needsTraining: boolean
  phone: string
  status: PersonStatus
  profileComplete: boolean
}

export interface Employer {
  id: string
  userId?: string
  name: string
  sphere: SphereId
  city: CityId
  district: DistrictId
  address: Localized
  contactName: string
  phone: string
  cooperation: CooperationStatus
}

export interface Vacancy {
  id: string
  employerId: string
  profession: ProfessionId
  title: Localized
  sphere: SphereId
  address: Localized
  district: DistrictId
  city: CityId
  salaryFrom: number
  salaryTo: number
  schedule: ScheduleId
  requirements: Localized
  education: EducationId
  experienceYears: number
  skills: SkillId[]
  openings: number
  contactName: string
  phone: string
  status: VacancyStatus
}

export interface Course {
  id: string
  direction: DirectionId
  title: Localized
  organization: string
  duration: Localized
  startDate: string
  seats: number
  status: CourseStatus
}

export interface Application {
  id: string
  personId: string
  vacancyId: string
  employerId: string
  status: ApplicationStatus
  score: number
  reason: Localized
  createdAt: string
  updatedAt: string
  reasonId?: ReasonId
  comment?: string
}

export interface TrainingReferral {
  id: string
  personId: string
  courseId: string
  status: TrainingStatus
  createdAt: string
}

export interface EmploymentRecord {
  id: string
  personId: string
  employerId?: string
  vacancyId?: string
  organization: string
  position: Localized
  date: string
  employmentType: EmploymentType
  employmentStatus: EmploymentStatus
}

export interface Notification {
  id: string
  userId: string
  type: 'match' | 'referral' | 'invite' | 'accepted' | 'rejected' | 'training' | 'system'
  title: Localized
  body: Localized
  createdAt: string
  read: boolean
  href?: string
}

export interface ChartPoint {
  id: string
  count: number
}

export interface MonthPoint {
  id: string
  employed: number
}

export interface NationalStats {
  total: number
  unemployed: number
  employed: number
  referred: number
  training: number
  refusals: number
  refusalReasons: { id: ReasonId; count: number }[]
  monthly: MonthPoint[]
  byProfession: ChartPoint[]
  byDistrict: ChartPoint[]
}

export interface AppState {
  users: User[]
  people: Person[]
  employers: Employer[]
  vacancies: Vacancy[]
  courses: Course[]
  applications: Application[]
  trainingReferrals: TrainingReferral[]
  employments: EmploymentRecord[]
  notifications: Notification[]
  national: NationalStats
  sessionUserId: string | null
  toast: Localized | null
}
