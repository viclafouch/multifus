import { ExternalLink, Lock } from 'lucide-react'
import type { Snapshot } from '@/@types/snapshot'
import { EmptyState } from '@/components/layout/empty-state'
import { Screen } from '@/components/layout/screen'
import { Button } from '@/components/ui/button'
import { strings } from '@/constants/strings'
import { openAuthorizationSettings, requestAuthorization } from '@/lib/multifus'

type AuthorizationScreenProps = Readonly<{
  run: (action: Promise<Snapshot>) => void
}>

export const AuthorizationScreen = ({ run }: AuthorizationScreenProps) => {
  return (
    <Screen title={strings.characters.title}>
      <EmptyState
        title={strings.authorization.title}
        body={strings.authorization.body}
        hint={strings.authorization.patience}
        mark={
          <span className="mb-2 flex size-11 items-center justify-center rounded-full border border-primary/25 bg-primary/8 text-primary">
            <Lock className="size-mark" strokeWidth={1.75} aria-hidden />
          </span>
        }
      >
        <Button
          size="sm"
          onClick={() => {
            run(requestAuthorization())
          }}
        >
          {strings.authorization.request}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            openAuthorizationSettings().catch(ignoreOpenFailure)
          }}
        >
          <ExternalLink aria-hidden />
          {strings.authorization.openSettings}
        </Button>
      </EmptyState>
    </Screen>
  )
}

const ignoreOpenFailure = () => {}
