export const gaugeValue = (
  value: number | readonly number[],
  fallback: number
) => {
  if (typeof value === 'number') {
    return value
  }

  return value.at(0) ?? fallback
}
