import type {
  CityId,
  DirectionId,
  DistrictId,
  EducationId,
  ProfessionId,
  ReasonId,
  ScheduleId,
  SkillId,
  SphereId,
} from './types'

export const PROFESSIONS: ProfessionId[] = [
  'welder',
  'installer',
  'electrician',
  'driver',
  'helper',
  'cook',
  'operator',
  'locksmith',
  'warehouse',
  'builder',
  'courier',
  'utility',
  'tractor',
  'painter',
  'loader',
]

export const SKILLS: SkillId[] = [
  'welding',
  'drawings',
  'safety',
  'mounting',
  'electrical',
  'driving_b',
  'driving_c',
  'driving_d',
  'driving_e',
  'cooking',
  'warehouse',
  'loading',
  'cleaning',
  'equipment',
  'plumbing',
  'painting',
  'agriculture',
  'construction',
  'logistics',
  'tools',
  'metalwork',
]

export const CITIES: CityId[] = ['almaty', 'astana', 'shymkent', 'karaganda']

export const DISTRICTS_BY_CITY: Record<CityId, DistrictId[]> = {
  almaty: ['bostandyk', 'auezov', 'almaly', 'medeu', 'turksib', 'zhetysu'],
  astana: ['esil', 'saryarka'],
  shymkent: ['abai', 'alfarabi'],
  karaganda: ['kazybek'],
}

export const EDUCATIONS: EducationId[] = ['secondary', 'vocational', 'higher']
export const SCHEDULES: ScheduleId[] = ['full', 'shift', 'flexible']
export const LICENSES = ['A', 'B', 'C', 'D', 'E', 'CE']
export const SPHERES: SphereId[] = [
  'construction',
  'production',
  'agriculture',
  'service',
  'utility',
  'logistics',
]
export const REASONS: ReasonId[] = [
  'requirements',
  'experience',
  'schedule',
  'no_contact',
  'closed',
  'candidate',
  'other',
]

export const DIRECTION_BY_PROFESSION: Record<ProfessionId, DirectionId> = {
  welder: 'welder',
  installer: 'installer',
  electrician: 'electrician',
  driver: 'driver',
  helper: 'construction',
  cook: 'cook',
  operator: 'operator',
  locksmith: 'other',
  warehouse: 'other',
  builder: 'construction',
  courier: 'driver',
  utility: 'utility',
  tractor: 'other',
  painter: 'construction',
  loader: 'utility',
}

export const RELATED: Record<ProfessionId, ProfessionId[]> = {
  welder: ['installer', 'locksmith', 'builder'],
  installer: ['welder', 'builder', 'painter'],
  electrician: ['operator', 'locksmith'],
  driver: ['tractor', 'courier'],
  helper: ['loader', 'utility', 'builder'],
  cook: ['helper'],
  operator: ['locksmith', 'electrician', 'tractor'],
  locksmith: ['welder', 'electrician', 'installer'],
  warehouse: ['loader', 'courier'],
  builder: ['installer', 'painter', 'welder', 'helper'],
  courier: ['driver', 'warehouse'],
  utility: ['helper', 'loader'],
  tractor: ['driver', 'operator'],
  painter: ['builder', 'helper'],
  loader: ['helper', 'warehouse', 'utility'],
}

export const DEMO_PASSWORD = 'demo123'
