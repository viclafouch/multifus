type FormatDateParams = Readonly<{
  day: string
  locale: string
}>

export const formatDate = ({ day, locale }: FormatDateParams) => {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'long',
    timeZone: 'UTC'
  }).format(new Date(day))
}
