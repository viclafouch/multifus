import { i18n } from '@lingui/core'

const SECONDS_IN_MINUTE = 60
const SECONDS_IN_HOUR = 3600

const MICROS_IN_MILLISECOND = 1000
const SHORT_FOCUS_MILLISECONDS = 10

export const focusDuration = (micros: number) => {
  const milliseconds = micros / MICROS_IN_MILLISECOND

  return new Intl.NumberFormat(i18n.locale, {
    style: 'unit',
    unit: 'millisecond',
    unitDisplay: 'short',
    maximumFractionDigits: milliseconds < SHORT_FOCUS_MILLISECONDS ? 1 : 0
  }).format(milliseconds)
}

export const screenSaverDelay = (seconds: number) => {
  const isHours = seconds >= SECONDS_IN_HOUR && seconds % SECONDS_IN_HOUR === 0

  const value = isHours
    ? seconds / SECONDS_IN_HOUR
    : Math.round(seconds / SECONDS_IN_MINUTE)

  return new Intl.NumberFormat(i18n.locale, {
    style: 'unit',
    unit: isHours ? 'hour' : 'minute',
    unitDisplay: 'long'
  }).format(value)
}
