const SECONDS_IN_MINUTE = 60
const SECONDS_IN_HOUR = 3600

const PLURALS = new Intl.PluralRules('fr-FR')

export const matchIsPlural = (count: number) => {
  return PLURALS.select(count) !== 'one'
}

export const screenSaverDelay = (seconds: number) => {
  const isHours = seconds >= SECONDS_IN_HOUR && seconds % SECONDS_IN_HOUR === 0

  const value = isHours
    ? seconds / SECONDS_IN_HOUR
    : Math.round(seconds / SECONDS_IN_MINUTE)

  return new Intl.NumberFormat('fr-FR', {
    style: 'unit',
    unit: isHours ? 'hour' : 'minute',
    unitDisplay: 'long'
  }).format(value)
}
