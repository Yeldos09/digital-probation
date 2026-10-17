import { DIRECTION_BY_PROFESSION, RELATED } from './constants'
import { vacancyIsOpen } from './domain'
import { joinClauses, yearsRu } from './format'
import { translate } from './i18n'
import type { Course, Employer, Lang, Localized, Person, ProfessionId, Vacancy } from './types'

const EDU_RANK = { secondary: 1, vocational: 2, higher: 3 }

export interface MatchResult {
  score: number
  reason: Localized
}

function licenseSkills(person: Person): Set<string> {
  const skills = new Set<string>(person.skills)
  if (!person.hasLicense) return skills
  for (const raw of person.licenseCategories) {
    const cat = raw.toUpperCase()
    if (cat === 'B') skills.add('driving_b')
    if (cat === 'C' || cat === 'CE') skills.add('driving_c')
    if (cat === 'D') skills.add('driving_d')
    if (cat === 'E' || cat === 'CE') skills.add('driving_e')
    if (cat === 'A') skills.add('driving_b')
  }
  return skills
}

function professionFit(person: Person, vacancy: Vacancy): 'exact' | 'related' | 'general' | 'low' {
  if (person.desiredProfession === vacancy.profession || person.profession === vacancy.profession) {
    return 'exact'
  }
  const related = new Set<ProfessionId>([
    ...(RELATED[person.profession] ?? []),
    ...(RELATED[person.desiredProfession] ?? []),
  ])
  if (related.has(vacancy.profession)) return 'related'
  if (
    (vacancy.profession === 'helper' || vacancy.profession === 'loader' || vacancy.profession === 'utility') &&
    person.experienceYears >= 1
  ) {
    return 'general'
  }
  return 'low'
}

function skillLabel(id: string, lang: Lang): string {
  return translate(lang, `skill.${id}`)
}

export function explainMatch(person: Person, vacancy: Vacancy): MatchResult {
  const fit = professionFit(person, vacancy)
  const professionPoints = fit === 'exact' ? 31 : fit === 'related' ? 25 : fit === 'general' ? 20 : 8

  const have = licenseSkills(person)
  const need = vacancy.skills
  const hit = need.filter((skill) => have.has(skill))
  const skillPoints = need.length === 0 ? 12 : Math.round((20 * hit.length) / need.length)

  const expGap = person.experienceYears - vacancy.experienceYears
  const expPoints = expGap >= 0 ? 15 : expGap === -1 ? 10 : person.experienceYears > 0 ? 6 : 3

  let eduRank = EDU_RANK[person.education]
  if (person.hasVocationalEducation && eduRank < 2) eduRank = 2
  const eduPoints = eduRank >= EDU_RANK[vacancy.education] ? 10 : 4

  const sameDistrict = person.district === vacancy.district
  const sameCity = person.city === vacancy.city
  const districtPoints = sameDistrict ? 10 : sameCity ? 5 : 2

  let schedulePoints = 2
  if (vacancy.schedule === 'full') schedulePoints = person.fullTime ? 8 : 2
  else if (vacancy.schedule === 'shift') schedulePoints = person.shiftWork ? 8 : 2
  else schedulePoints = person.fullTime || person.shiftWork ? 6 : 3

  const mid = (vacancy.salaryFrom + vacancy.salaryTo) / 2
  const salaryPoints =
    mid >= person.desiredSalary * 0.9 ? 5 : vacancy.salaryTo >= person.desiredSalary * 0.75 ? 3 : 1

  const score = Math.max(
    0,
    Math.min(
      100,
      professionPoints + skillPoints + expPoints + eduPoints + districtPoints + schedulePoints + salaryPoints,
    ),
  )

  const build = (lang: Lang): string => {
    const clauses: string[] = []
    if (fit === 'exact') {
      clauses.push(
        lang === 'ru'
          ? 'кандидат имеет соответствующую специальность'
          : 'кандидаттың мамандығы сәйкес келеді',
      )
    } else if (fit === 'related' || fit === 'general') {
      clauses.push(
        lang === 'ru'
          ? 'специальность близка к требованиям вакансии'
          : 'мамандығы бос орын талабына жақын',
      )
    }
    if (expPoints >= 10 && person.experienceYears > 0) {
      clauses.push(
        lang === 'ru'
          ? `опыт работы ${yearsRu(person.experienceYears)}`
          : `жұмыс өтілі ${person.experienceYears} жыл`,
      )
    }
    if (sameDistrict) {
      clauses.push(lang === 'ru' ? 'проживает в том же районе' : 'ол сол ауданда тұрады')
    }
    if (need.length > 0 && hit.length / need.length >= 0.5) {
      const names = hit.map((id) => skillLabel(id, lang)).join(', ')
      clauses.push(lang === 'ru' ? `навыки совпадают: ${names}` : `дағдылары сәйкес: ${names}`)
    }
    if (schedulePoints >= 8) {
      clauses.push(lang === 'ru' ? 'график работы совпадает' : 'жұмыс кестесі сәйкес келеді')
    }
    if (eduPoints >= 10) {
      clauses.push(
        lang === 'ru' ? 'образование соответствует требованиям' : 'білім деңгейі талапқа сай',
      )
    }
    if (salaryPoints >= 5) {
      clauses.push(
        lang === 'ru' ? 'уровень оплаты близок к ожиданиям' : 'жалақы күткен деңгейге жақын',
      )
    }
    if (!sameDistrict && sameCity) {
      clauses.push(lang === 'ru' ? 'проживает в том же городе' : 'ол сол қалада тұрады')
    }

    const chosen = clauses.slice(0, 3)
    if (chosen.length === 0) {
      return lang === 'ru'
        ? `Вакансия подходит на ${score}%. Совпадение с требованиями частичное.`
        : `Бос орын ${score}%-ға сәйкес келеді. Талаптармен сәйкестік ішінара.`
    }
    const body = joinClauses(chosen, lang)
    return lang === 'ru'
      ? `Вакансия подходит на ${score}%, поскольку ${body}.`
      : `Бос орын ${score}%-ға сәйкес келеді, өйткені ${body}.`
  }

  return { score, reason: { ru: build('ru'), kk: build('kk') } }
}

export function rankVacancies(person: Person, vacancies: Vacancy[], employers: Employer[]) {
  return vacancies
    .filter((vacancy) => vacancyIsOpen(vacancy, employers))
    .flatMap((vacancy) => {
      const employer = employers.find((item) => item.id === vacancy.employerId)
      if (!employer) return []
      return [{ vacancy, employer, ...explainMatch(person, vacancy) }]
    })
    .sort((a, b) => b.score - a.score || b.vacancy.salaryTo - a.vacancy.salaryTo)
}

export function shouldRecommendTraining(person: Person, topScore: number | null): boolean {
  if (topScore === null) return true
  if (topScore < 64) return true
  return person.needsTraining && topScore < 75
}

export function suggestedCourses(person: Person, courses: Course[], topScore: number | null): Course[] {
  if (!shouldRecommendTraining(person, topScore)) return []
  const direction =
    DIRECTION_BY_PROFESSION[person.desiredProfession] ??
    DIRECTION_BY_PROFESSION[person.profession] ??
    'other'
  const open = courses.filter((course) => course.status !== 'full' && course.seats > 0)
  const matched = open.filter((course) => course.direction === direction)
  if (matched.length > 0) return matched
  const fallback = open.filter((course) => course.direction === 'other')
  return fallback.length > 0 ? fallback : open.slice(0, 3)
}
