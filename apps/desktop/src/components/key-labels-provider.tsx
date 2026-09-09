import React from 'react'
import type { KeyLabels } from '@/@types/system'

const NO_LABELS: KeyLabels = {}

const KeyLabelsContext = React.createContext<KeyLabels>(NO_LABELS)

type KeyLabelsProviderProps = Readonly<{
  labels: KeyLabels
  children: React.ReactNode
}>

export const KeyLabelsProvider = ({
  labels,
  children
}: KeyLabelsProviderProps) => {
  return <KeyLabelsContext value={labels}>{children}</KeyLabelsContext>
}

export const useKeyLabels = () => {
  return React.useContext(KeyLabelsContext)
}
