/** What a number of the system is worth in French. */

const SECONDS_IN_MINUTE = 60
const SECONDS_IN_HOUR = 3600

/**
 * How long before the screen saver starts, in words. The system files this in
 * seconds and offers it in minutes, so an hour is said as one and not as sixty.
 */
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
