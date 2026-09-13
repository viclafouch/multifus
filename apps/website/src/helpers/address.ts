import { HOST } from '@/constants/host'
import type { PathParams } from '@/helpers/page'
import { ogPathOf, pathOf } from '@/helpers/page'

export const addressOf = ({ page, language }: PathParams) => {
  return `${HOST}${pathOf({ page, language })}`
}

export const ogAddressOf = ({ page, language }: PathParams) => {
  return `${HOST}${ogPathOf({ page, language })}`
}
