import React from 'react'
import { FolderOpen, RotateCcw, TriangleAlert } from 'lucide-react'
import { t } from '@lingui/core/macro'
import { EmptyState, EmptyStateMark } from '@/components/layout/empty-state'
import { Button } from '@/components/ui/button'
import { revealJournal } from '@/lib/multifus'
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
          <span className="selectable font-mono text-mini break-all">
            {message}
          </span>
        }
      >
        <Button
          size="sm"
          onClick={() => {
            window.location.reload()
          }}
        >
          <RotateCcw aria-hidden />
          {t`Recharger l’écran`}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            revealJournal().catch(ignore)
          }}
        >
          <FolderOpen aria-hidden />
          {t`Montrer le fichier du journal`}
        </Button>
      </EmptyState>
    </div>
  )
}
