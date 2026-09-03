import { MessageSquareText } from 'lucide-react'
import { t } from '@lingui/core/macro'
import type { RelayStatus } from '@/@types/relay'
import type { Character } from '@/@types/roster'
import type { Snapshot } from '@/@types/snapshot'
import { FieldRow } from '@/components/layout/field-row'
import { Panel } from '@/components/layout/panel'
import { PanelHeader } from '@/components/layout/panel-header'
import { Screen } from '@/components/layout/screen'
import { LinkButton } from '@/components/link-button'
import { Switch } from '@/components/ui/switch'
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
  const bodyLabel = t`Recevoir ce que le joueur a écrit`

  return (
    <Screen
      title={t`Messages privés`}
      subtitle={t`Un joueur vous écrit pendant que vous êtes ailleurs ? Son message arrive sur votre téléphone, dans Telegram. Telegram, parce que c’est gratuit et que c’est la seule messagerie qu’un logiciel peut faire parler aussi simplement.`}
    >
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
          title={t`Personnages relayés`}
          description={t`Cochez ceux dont vous voulez les messages privés, en général celui avec qui vous jouez vraiment. Un personnage déconnecté reste coché, et Multifus le reprend dès qu’il se reconnecte.`}
        />
        {characters.length === 0 ? (
          <p className="px-4 py-3.5 text-note text-muted-foreground">
            {t`Connectez un personnage dans Dofus Retro : il arrive ici, déjà coché.`}
          </p>
        ) : (
          <RelayedList characters={characters} run={run} />
        )}
      </Panel>
      <Panel>
        <FieldRow
          label={bodyLabel}
          description={t`Coché, vous lisez son message dans Telegram. Décoché, vous savez seulement lequel de vos personnages a reçu un message privé.`}
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
            aria-label={bodyLabel}
            onCheckedChange={(sendBody) => {
              run(setSendBody(sendBody))
            }}
          />
        </FieldRow>
      </Panel>
      <div className="mt-3">
        <LinkButton
          label={t`À quoi sert un robot Telegram ?`}
          onOpen={() => {
            return openRelayLink('faq')
          }}
        />
      </div>
    </Screen>
  )
}
