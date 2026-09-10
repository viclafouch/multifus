import React from 'react'
import type { Snapshot } from '@/@types/snapshot'
import { HealthDialog } from '@/components/health-dialog'
import type { HelpDialog } from '@/components/help-context'
import { HelpContext } from '@/components/help-context'
import { useGoToMap } from '@/components/map-navigation-provider'
import { QuestionsDialog } from '@/components/questions-dialog'
import type { HealthSubject } from '@/helpers/health'
import { useHealthCall } from '@/hooks/use-health-call'

type HelpProviderProps = HealthSubject &
  Readonly<{
    run: (action: Promise<Snapshot>) => void
    children: React.ReactNode
  }>

const stillShowing = (isOpen: boolean, dialog: HelpDialog) => {
  return isOpen ? dialog : null
}

export const HelpProvider = ({
  onboarding,
  isAutoFocusEnabled,
  run,
  children
}: HelpProviderProps) => {
  const [shown, setShown] = React.useState<HelpDialog | null>(null)
  const goToMap = useGoToMap()

  useHealthCall(() => {
    goToMap('settings')
    setShown('health')
  })

  return (
    <HelpContext value={setShown}>
      {children}
      <HealthDialog
        isOpen={shown === 'health'}
        onOpenChange={(isOpen) => {
          setShown(stillShowing(isOpen, 'health'))
        }}
        onboarding={onboarding}
        isAutoFocusEnabled={isAutoFocusEnabled}
        run={run}
      />
      <QuestionsDialog
        isOpen={shown === 'questions'}
        onOpenChange={(isOpen) => {
          setShown(stillShowing(isOpen, 'questions'))
        }}
        run={run}
      />
    </HelpContext>
  )
}
