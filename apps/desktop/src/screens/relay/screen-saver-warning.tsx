import { TriangleAlert } from 'lucide-react'
import { t } from '@lingui/core/macro'
import { Panel } from '@/components/layout/panel'
import { screenSaverDelay } from '@/helpers/format'

const screenSaverLine = (seconds: number) => {
  const delay = screenSaverDelay(seconds)

  return t`Multifus garde l’écran allumé, mais votre écran de veille démarre après ${delay} et verrouille l’ordinateur. Multifus n’entend plus le jeu, et vous ne recevez plus rien. Réglez-le sur Jamais.`
}

type ScreenSaverWarningProps = Readonly<{
  seconds: number
}>

export const ScreenSaverWarning = ({ seconds }: ScreenSaverWarningProps) => {
  return (
    <Panel className="mb-3">
      <div className="flex items-start gap-3 px-4 py-3.5">
        <TriangleAlert
          aria-hidden
          className="mt-0.5 size-4 shrink-0 text-destructive"
          strokeWidth={1.9}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 className="text-row font-medium">
            {t`Votre écran de veille peut tout arrêter`}
          </h2>
          <p className="max-w-prose text-note text-muted-foreground">
            {screenSaverLine(seconds)}
          </p>
        </div>
      </div>
    </Panel>
  )
}
