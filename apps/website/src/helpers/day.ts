type WrittenDayParams = Readonly<{
  day: string
  locale: string
}>

export const writtenDay = ({ day, locale }: WrittenDayParams) => {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'long',
    timeZone: 'UTC'
  }).format(new Date(day))
}
