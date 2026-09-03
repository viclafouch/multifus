import { ExternalLink, Lock } from 'lucide-react'
import { t } from '@lingui/core/macro'
import type { Snapshot } from '@/@types/snapshot'
import { EmptyState, EmptyStateMark } from '@/components/layout/empty-state'
import { Screen } from '@/components/layout/screen'
import { Button } from '@/components/ui/button'
import { IS_APPLE } from '@/constants/keyboard'
import { openAuthorizationSettings, requestAuthorization } from '@/lib/multifus'
import { ignore } from '@/lib/utils'

type AuthorizationScreenProps = Readonly<{
  run: (action: Promise<Snapshot>) => void
}>

export const AuthorizationScreen = ({ run }: AuthorizationScreenProps) => {
  return (
    <Screen title={t`Personnages`}>
      <EmptyState
        title={t`Multifus attend votre feu vert`}
        body={
          IS_APPLE
            ? t`Sans l’autorisation Accessibilité, Multifus ne peut pas lire le pseudo dans le titre de vos fenêtres Dofus Retro, les mettre devant vous, ni entendre le jeu vous appeler.`
            : t`Sans l’accès aux notifications, Multifus ne peut pas entendre le jeu vous appeler, ni mettre la bonne fenêtre Dofus Retro devant vous.`
        }
        hint={
          IS_APPLE
            ? t`macOS n’accorde jamais cette autorisation dans la seconde. Cochez Multifus dans Réglages Système, puis revenez : cet écran disparaîtra tout seul.`
            : t`Autorisez Multifus dans les réglages du système, puis revenez : cet écran disparaîtra tout seul.`
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            openAuthorizationSettings().catch(ignore)
          }}
        >
          <ExternalLink aria-hidden />
          {IS_APPLE
            ? t`Ouvrir Réglages Système`
            : t`Ouvrir les réglages du système`}
        </Button>
      </EmptyState>
    </Screen>
  )
}
