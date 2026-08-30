import { Bug, CodeXml, Download, Package, RefreshCw } from 'lucide-react'
import type { Snapshot } from '@/@types/snapshot'
import type { UpdateStatus } from '@/@types/system'
import { FieldRow } from '@/components/layout/field-row'
import { Panel } from '@/components/layout/panel'
import { PanelHeader } from '@/components/layout/panel-header'
import { LinkButton } from '@/components/link-button'
import { Button } from '@/components/ui/button'
import { strings } from '@/constants/strings'
import { updateLine } from '@/helpers/wording'
import { checkUpdate, installUpdate, openAboutLink } from '@/lib/multifus'

type ProjectPanelProps = Readonly<{
  update: UpdateStatus
  run: (action: Promise<Snapshot>) => void
}>

export const ProjectPanel = ({ update, run }: ProjectPanelProps) => {
  const words = strings.about
  const isChecking = update.kind === 'checking'
  const hasUpdate = update.kind === 'available' || update.kind === 'installing'
  const isBusy = isChecking || update.kind === 'installing'

  return (
    <Panel className="mb-3">
      <PanelHeader
        title={words.projectTitle}
        description={words.projectDescription}
      />
      <FieldRow
        label={words.updateTitle}
        description={updateLine(update)}
        icon={<Package className="size-glyph" strokeWidth={1.75} aria-hidden />}
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
          {hasUpdate ? words.install : words.check}
        </Button>
      </FieldRow>
      <FieldRow
        label={words.sourceLabel}
        description={words.sourceDescription}
        icon={<CodeXml className="size-glyph" strokeWidth={1.75} aria-hidden />}
      >
        <LinkButton
          label={words.sourceOpen}
          onOpen={() => {
            return openAboutLink('source')
          }}
        />
      </FieldRow>
      <FieldRow
        label={words.issuesLabel}
        description={words.issuesDescription}
        icon={<Bug className="size-glyph" strokeWidth={1.75} aria-hidden />}
      >
        <LinkButton
          label={words.issuesOpen}
          onOpen={() => {
            return openAboutLink('issues')
          }}
        />
      </FieldRow>
    </Panel>
  )
}
