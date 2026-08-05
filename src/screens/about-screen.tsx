import React from 'react'
import { RotateCcw } from 'lucide-react'
import { FieldRow, Note, Panel, Screen } from '@/components/screen'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import type { ConfigStatus, Snapshot } from '@/lib/multifus'
import { reset, setStartAtLogin } from '@/lib/multifus'
import { strings } from '@/lib/strings'

type FactProps = Readonly<{
  label: string
  value: string
}>

/** One line of the identity card at the top of the screen. */
const Fact = ({ label, value }: FactProps) => {
  return (
    <div className="flex gap-6">
      <dt className="w-28 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="selectable min-w-0 font-mono text-note break-all text-foreground/80">
        {value}
      </dd>
    </div>
  )
}

type AboutScreenProps = Readonly<{
  version: string
  config: ConfigStatus
  startAtLogin: boolean
  run: (action: Promise<Snapshot>) => void
}>

/**
 * How multifus sits on this machine: which version, where its file is, when it
 * starts, and how to wipe it.
 *
 * The start with the session belongs here rather than on a screen of its own.
 * It is a fact about the installation and not about the game, it is set once and
 * never touched again, and a fifth entry in the rail for a single switch would
 * cost more than it explains.
 *
 * Dracoon opens on a modal warning that cannot be dismissed for thirty seconds.
 * perimetre.md drops it: the notice lives here, on a screen one visits, and it
 * blocks nothing. The reset is the opposite case, it is the only thing that can
 * lose work, so that one does ask first and says exactly what will be lost.
 */
export const AboutScreen = ({
  version,
  config,
  startAtLogin,
  run
}: AboutScreenProps) => {
  const [isConfirming, setIsConfirming] = React.useState(false)

  return (
    <Screen title={strings.about.title}>
      <Panel className="divide-y divide-border/70">
        <dl className="flex flex-col gap-2 px-4 py-3.5 text-body">
          <Fact label={strings.about.version} value={version} />
          <Fact label={strings.about.configPath} value={config.path} />
        </dl>
        <FieldRow
          label={strings.about.startupLabel}
          description={strings.about.startupDescription}
        >
          <Switch
            checked={startAtLogin}
            aria-label={strings.about.startupLabel}
            onCheckedChange={(checked) => {
              run(setStartAtLogin(checked))
            }}
          />
        </FieldRow>
        <section className="flex flex-col gap-1.5 px-4 py-3.5">
          <h2 className="text-row font-medium">{strings.about.legalTitle}</h2>
          <p className="max-w-prose text-note text-muted-foreground">
            {strings.about.legalBody}
          </p>
          <p className="max-w-prose text-note text-muted-foreground">
            {strings.about.legalScope}
          </p>
        </section>
        <section className="flex items-center gap-5 px-4 py-3.5">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h2 className="text-row font-medium">{strings.about.resetTitle}</h2>
            <p className="max-w-prose text-note text-muted-foreground">
              {strings.about.resetBody}
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              setIsConfirming(true)
            }}
          >
            <RotateCcw aria-hidden />
            {strings.about.reset}
          </Button>
        </section>
      </Panel>
      <Note>{strings.about.startupNote}</Note>
      <AlertDialog open={isConfirming} onOpenChange={setIsConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {strings.about.resetConfirmTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {strings.about.resetConfirmBody}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{strings.about.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setIsConfirming(false)
                run(reset())
              }}
            >
              {strings.about.resetConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Screen>
  )
}
