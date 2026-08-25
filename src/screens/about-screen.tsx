import React from 'react'
import { Download, RefreshCw, RotateCcw } from 'lucide-react'
import type { Snapshot } from '@/@types/snapshot'
import type { ConfigStatus, UpdateStatus } from '@/@types/system'
import { Panel } from '@/components/layout/panel'
import { Screen } from '@/components/layout/screen'
import { SectionRow } from '@/components/layout/section-row'
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
import { strings } from '@/constants/strings'
import { updateLine } from '@/helpers/wording'
import { checkUpdate, installUpdate, reset } from '@/lib/multifus'

type FactProps = Readonly<{
  label: string
  value: string
}>

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

type UpdateSectionProps = Readonly<{
  update: UpdateStatus
  run: (action: Promise<Snapshot>) => void
}>

const UpdateSection = ({ update, run }: UpdateSectionProps) => {
  const isChecking = update.kind === 'checking'
  const hasUpdate = update.kind === 'available' || update.kind === 'installing'
  const isBusy = isChecking || update.kind === 'installing'

  return (
    <SectionRow
      title={strings.about.updateTitle}
      description={updateLine(update)}
    >
      <Button
        variant="secondary"
        size="sm"
        aria-busy={isBusy}
        onClick={() => {
          run(hasUpdate ? installUpdate() : checkUpdate())
        }}
      >
        {hasUpdate ? (
          <Download aria-hidden />
        ) : (
          <RefreshCw
            aria-hidden
            data-busy={isChecking ? '' : undefined}
            className="data-busy:animate-spin"
          />
        )}
        {hasUpdate ? strings.about.install : strings.about.check}
      </Button>
    </SectionRow>
  )
}

type AboutScreenProps = Readonly<{
  version: string
  config: ConfigStatus
  update: UpdateStatus
  run: (action: Promise<Snapshot>) => void
}>

export const AboutScreen = ({
  version,
  config,
  update,
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
        <UpdateSection update={update} run={run} />
        <section className="flex flex-col gap-1.5 px-4 py-3.5">
          <h2 className="text-row font-medium">{strings.about.legalTitle}</h2>
          <p className="max-w-prose text-note text-muted-foreground">
            {strings.about.legalBody}
          </p>
          <p className="max-w-prose text-note text-muted-foreground">
            {strings.about.legalScope}
          </p>
        </section>
        <SectionRow
          title={strings.about.resetTitle}
          description={strings.about.resetBody}
        >
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
        </SectionRow>
      </Panel>
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
