import { ExternalLink, Lock } from 'lucide-react'
import type { Snapshot } from '@/@types/snapshot'
import { EmptyState, Screen } from '@/components/screen'
import { Button } from '@/components/ui/button'
import { strings } from '@/constants/strings'
import { openAuthorizationSettings, requestAuthorization } from '@/lib/multifus'

type AuthorizationScreenProps = Readonly<{
  run: (action: Promise<Snapshot>) => void
}>

/**
 * What stands in for the roster while the system will not let multifus look.
 *
 * It has to hold rather than blink. macOS never grants Accessibility in the
 * second that follows the request, so the ordinary state right after asking is
 * still a refusal. This is a screen, it stays, and it leaves on its own the
 * moment the scan finds the authorization granted.
 *
 * Only the characters screen is replaced. The shortcuts, the switches and the
 * about screen work without any authorization at all.
 */
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

/** The Rust side journals what the system refused to open. Nothing to add. */
const ignoreOpenFailure = () => {}
