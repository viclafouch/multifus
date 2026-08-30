import type { Snapshot } from '@/@types/snapshot'
import type { ConfigStatus, UpdateStatus } from '@/@types/system'
import { Screen } from '@/components/layout/screen'
import { strings } from '@/constants/strings'
import { IdentityPanel } from '@/screens/about/identity-panel'
import { LegalPanel } from '@/screens/about/legal-panel'
import { ProjectPanel } from '@/screens/about/project-panel'
import { ResetPanel } from '@/screens/about/reset-panel'

type AboutScreenProps = Readonly<{
  version: string
  system: string
  config: ConfigStatus
  update: UpdateStatus
  run: (action: Promise<Snapshot>) => void
}>

export const AboutScreen = ({
  version,
  system,
  config,
  update,
  run
}: AboutScreenProps) => {
  return (
    <Screen title={strings.about.title}>
      <IdentityPanel
        version={version}
        system={system}
        configPath={config.path}
      />
      <ProjectPanel update={update} run={run} />
      <LegalPanel />
      <ResetPanel run={run} />
    </Screen>
  )
}
