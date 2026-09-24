import type { Authorization } from '@/@types/system'

export const matchIsGranted = ({ granted }: Authorization) => {
  return granted ?? false
}

export const matchIsDenied = ({ granted }: Authorization) => {
  return !(granted ?? true)
}
