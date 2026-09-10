import React from 'react'
import { ignore } from '@/lib/utils'

export type HelpDialog = 'health' | 'questions'

export const HelpContext =
  React.createContext<(dialog: HelpDialog | null) => void>(ignore)

export const useOpenHelp = () => {
  return React.useContext(HelpContext)
}
