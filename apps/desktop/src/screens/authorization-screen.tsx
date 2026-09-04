import { Lock } from 'lucide-react'
import { t } from '@lingui/core/macro'
import type { Snapshot } from '@/@types/snapshot'
import { EmptyState, EmptyStateMark } from '@/components/layout/empty-state'
import { Screen } from '@/components/layout/screen'
import { SystemPageButton } from '@/components/system-page-button'
import { Button } from '@/components/ui/button'
import { IS_APPLE } from '@/constants/keyboard'
import { quoted, systemWords } from '@/helpers/wording'
import { requestAuthorization } from '@/lib/multifus'

type AuthorizationScreenProps = Readonly<{
  run: (action: Promise<Snapshot>) => void
}>

export const AuthorizationScreen = ({ run }: AuthorizationScreenProps) => {
  const words = systemWords()
  const settings = quoted(words.settings)
  const accessibility = quoted(words.accessibility)

  return (
    <Screen title={t`Personnages`}>
      <EmptyState
        title={t`Multifus attend votre autorisation`}
        body={
          IS_APPLE
            ? t`Sans l’autorisation ${accessibility}, Multifus ne peut pas lire le pseudo dans le titre de vos fenêtres Dofus Retro, les mettre devant vous, ni entendre le jeu vous appeler.`
            : t`Sans l’accès aux notifications, Multifus ne peut pas entendre le jeu vous appeler, ni mettre la bonne fenêtre Dofus Retro devant vous.`
        }
        hint={
          IS_APPLE
            ? t`Votre Mac n’accorde jamais cette autorisation dans la seconde. Cochez Multifus dans ${settings}, puis revenez : cet écran disparaîtra tout seul.`
            : t`Autorisez Multifus dans ${settings}, puis revenez : cet écran disparaîtra tout seul.`
        }
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
          {t`Demander l’autorisation`}
        </Button>
        <SystemPageButton page="authorization" variant="outline" size="sm" />
      </EmptyState>
    </Screen>
  )
}
