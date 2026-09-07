import React from 'react'
import { TriangleAlert } from 'lucide-react'
import { t } from '@lingui/core/macro'
import { EmptyState, EmptyStateMark } from '@/components/layout/empty-state'
import { Button } from '@/components/retro/button'
import { forgetMap } from '@/lib/map-memory'
import { revealJournal, screenStopped } from '@/lib/multifus'
import { errorMessage, ignore } from '@/lib/utils'

type ErrorBoundaryProps = Readonly<{
  children: React.ReactNode
}>

type ErrorBoundaryState = {
  readonly message: string | null
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { message: null }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { message: errorMessage(error) }
  }

  // oxlint-disable-next-line class-methods-use-this -- React n’appelle componentDidCatch que sur l’instance
  componentDidCatch(error: unknown) {
    screenStopped(errorMessage(error)).catch(ignore)
  }

  render() {
    const { message } = this.state

    if (message === null) {
      return this.props.children
    }

    return <CrashScreen message={message} />
  }
}

type CrashScreenProps = Readonly<{
  message: string
}>

const CrashScreen = ({ message }: CrashScreenProps) => {
  return (
    <div role="alert" className="flex min-h-screen flex-col justify-center p-7">
      <EmptyState
        title={t`L’écran s’est arrêté`}
        body={t`Multifus, lui, tourne toujours : vos raccourcis répondent, et une notification ramène encore la bonne fenêtre. Il n’y a que cet écran à relancer.`}
        mark={
          <EmptyStateMark tone="destructive">
            <TriangleAlert
              className="size-mark"
              strokeWidth={1.75}
              aria-hidden
            />
          </EmptyStateMark>
        }
        footer={
          <span className="selectable font-mono text-log wrap-anywhere">
            {message}
          </span>
        }
      >
        <Button
          size="sm"
          onClick={() => {
            forgetMap()
            window.location.reload()
          }}
        >
          {t`Recharger l’écran`}
        </Button>
        <Button
          variant="slate"
          size="sm"
          onClick={() => {
            revealJournal().catch(ignore)
          }}
        >
          {t`Montrer le fichier du journal`}
        </Button>
      </EmptyState>
    </div>
  )
}
