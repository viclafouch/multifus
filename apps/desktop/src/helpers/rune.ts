import { i18n } from '@lingui/core'

const WEIGHT_DECIMALS = 2

export const runeWeight = (weight: number) => {
  return new Intl.NumberFormat(i18n.locale, {
    maximumFractionDigits: WEIGHT_DECIMALS
  }).format(weight)
}
