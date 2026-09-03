import { t } from '@lingui/core/macro'
import type { RelayStatus } from '@/@types/relay'
import type { Snapshot } from '@/@types/snapshot'
import { Panel } from '@/components/layout/panel'
import { PanelHeader } from '@/components/layout/panel-header'
import { Step } from '@/screens/relay/step'
import { TokenForm } from '@/screens/relay/token-form'

type PairingGuideProps = Readonly<{
  relay: RelayStatus
  run: (action: Promise<Snapshot>) => void
}>

export const PairingGuide = ({ relay, run }: PairingGuideProps) => {
  return (
    <Panel className="mb-3">
      <PanelHeader
        title={t`Relier votre téléphone`}
        description={t`Installez Telegram sur votre téléphone, puis suivez ces cinq étapes ici. Après, on n’y revient plus.`}
      />
      <ol className="flex flex-col py-2">
        <Step
          rank={1}
          title={t`Ouvrez Telegram sur cet ordinateur`}
          body={t`Scannez le code affiché avec Telegram, sur votre téléphone.`}
          link="web"
          action={t`Ouvrir Telegram Web`}
        />
        <Step
          rank={2}
          title={t`Demandez un robot à BotFather`}
          body={t`Écrivez-lui /newbot et répondez à ses questions, il parle anglais. Ce robot sera le contact qui vous écrira.`}
          link="botFather"
          action={t`Ouvrir BotFather`}
        />
        <Step
          rank={3}
          title={t`Copiez le code du robot, collez-le ci-dessous`}
          body={t`BotFather finit par une longue suite de chiffres et de lettres. Un clic dessus la copie.`}
        />
        <Step
          rank={4}
          title={t`Écrivez « salut » à votre robot`}
          body={t`Un robot ne parle jamais le premier. Sans ce message, il n’a pas le droit de vous écrire.`}
        />
        <Step
          rank={5}
          title={t`Cliquez sur Connecter`}
          body={t`Multifus écrit à votre robot. Si le message arrive sur votre téléphone, c’est gagné.`}
        />
      </ol>
      <TokenForm relay={relay} run={run} />
    </Panel>
  )
}
