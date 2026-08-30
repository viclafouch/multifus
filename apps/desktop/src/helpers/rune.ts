const WEIGHT_FORMAT = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 2
})

export const runeWeight = (weight: number) => {
  return WEIGHT_FORMAT.format(weight)
}
