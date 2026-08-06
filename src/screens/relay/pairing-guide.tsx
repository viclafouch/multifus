import type { RelayStatus } from '@/@types/relay'
import type { Snapshot } from '@/@types/snapshot'
import { Panel } from '@/components/layout/panel'
import { PanelHeader } from '@/components/layout/panel-header'
import { strings } from '@/constants/strings'
import { Step } from '@/screens/relay/step'
import { TokenForm } from '@/screens/relay/token-form'

type PairingGuideProps = Readonly<{
  relay: RelayStatus
  run: (action: Promise<Snapshot>) => void
}>

/**
 * The whole setup, in the order it is done, for somebody who has never opened
 * Telegram. Five numbered steps, two of which say why and not only what.
 */
export const PairingGuide = ({ relay, run }: PairingGuideProps) => {
  const { steps } = strings.relay

  return (
    <Panel className="mb-3">
      <PanelHeader
        title={strings.relay.guideTitle}
        description={strings.relay.guideIntro}
      />
      <ol className="flex flex-col py-2">
        <Step
          rank={1}
          title={steps.web.title}
          body={steps.web.body}
          link="web"
          action={steps.web.action}
        />
        <Step
          rank={2}
          title={steps.create.title}
          body={steps.create.body}
          link="botFather"
          action={steps.create.action}
        />
        <Step rank={3} title={steps.paste.title} body={steps.paste.body} />
        <Step rank={4} title={steps.write.title} body={steps.write.body} />
        <Step rank={5} title={steps.connect.title} body={steps.connect.body} />
      </ol>
      <TokenForm relay={relay} run={run} />
    </Panel>
  )
}
