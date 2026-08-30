import { TriangleAlert } from 'lucide-react'
import { Panel } from '@/components/layout/panel'
import { strings } from '@/constants/strings'
import { screenSaverDelay } from '@/helpers/format'

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
            {strings.relay.screenSaverTitle}
          </h2>
          <p className="max-w-prose text-note text-muted-foreground">
            {strings.relay.screenSaverBody(screenSaverDelay(seconds))}
          </p>
        </div>
      </div>
    </Panel>
  )
}
