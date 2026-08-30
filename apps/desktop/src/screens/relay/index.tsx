import { MessageSquareText } from 'lucide-react'
import type { RelayStatus } from '@/@types/relay'
import type { Character } from '@/@types/roster'
import type { Snapshot } from '@/@types/snapshot'
import { FieldRow } from '@/components/layout/field-row'
import { Panel } from '@/components/layout/panel'
import { PanelHeader } from '@/components/layout/panel-header'
import { Screen } from '@/components/layout/screen'
import { LinkButton } from '@/components/link-button'
import { Switch } from '@/components/ui/switch'
import { strings } from '@/constants/strings'
import { openRelayLink, setSendBody } from '@/lib/multifus'
import { BotPanel } from '@/screens/relay/bot-panel'
import { PairingGuide } from '@/screens/relay/pairing-guide'
import { RelayedList } from '@/screens/relay/relayed-list'
import { ScreenSaverWarning } from '@/screens/relay/screen-saver-warning'
import { StatePanel } from '@/screens/relay/state-panel'
import { TestPanel } from '@/screens/relay/test-panel'

type RelayScreenProps = Readonly<{
  relay: RelayStatus
  characters: readonly Character[]
  run: (action: Promise<Snapshot>) => void
}>

export const RelayScreen = ({ relay, characters, run }: RelayScreenProps) => {
  return (
    <Screen title={strings.relay.title} subtitle={strings.relay.subtitle}>
      {relay.paired ? (
        <>
          <StatePanel relay={relay} run={run} />
          <BotPanel isWorking={relay.pairing.kind === 'working'} run={run} />
          <TestPanel test={relay.test} run={run} />
        </>
      ) : (
        <PairingGuide relay={relay} run={run} />
      )}
      {relay.screenSaver.kind === 'after' ? (
        <ScreenSaverWarning seconds={relay.screenSaver.seconds} />
      ) : null}
      <Panel className="mb-3">
        <PanelHeader
          title={strings.relay.charactersTitle}
          description={strings.relay.charactersBody}
        />
        {characters.length === 0 ? (
          <p className="px-4 py-3.5 text-note text-muted-foreground">
            {strings.relay.emptyBody}
          </p>
        ) : (
          <RelayedList characters={characters} run={run} />
        )}
      </Panel>
      <Panel>
        <FieldRow
          label={strings.relay.bodyLabel}
          description={strings.relay.bodyDescription}
          icon={
            <MessageSquareText
              className="size-glyph"
              strokeWidth={1.75}
              aria-hidden
            />
          }
        >
          <Switch
            checked={relay.sendBody}
            aria-label={strings.relay.bodyLabel}
            onCheckedChange={(sendBody) => {
              run(setSendBody(sendBody))
            }}
          />
        </FieldRow>
      </Panel>
      <div className="mt-3">
        <LinkButton
          label={strings.relay.help}
          onOpen={() => {
            return openRelayLink('faq')
          }}
        />
      </div>
    </Screen>
  )
}
