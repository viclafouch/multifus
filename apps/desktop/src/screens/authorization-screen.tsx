import { ExternalLink, Lock } from 'lucide-react'
import type { Snapshot } from '@/@types/snapshot'
import { EmptyState, EmptyStateMark } from '@/components/layout/empty-state'
import { Screen } from '@/components/layout/screen'
import { Button } from '@/components/ui/button'
import { strings } from '@/constants/strings'
import { openAuthorizationSettings, requestAuthorization } from '@/lib/multifus'
import { ignore } from '@/lib/utils'

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
          <EmptyStateMark tone="primary">
            <Lock className="size-mark" strokeWidth={1.75} aria-hidden />
          </EmptyStateMark>
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
            openAuthorizationSettings().catch(ignore)
          }}
        >
          <ExternalLink aria-hidden />
          {strings.authorization.openSettings}
        </Button>
      </EmptyState>
    </Screen>
  )
}
