import { Bug, CodeXml, Download, Package, RefreshCw } from 'lucide-react'
import { t } from '@lingui/core/macro'
import type { Snapshot } from '@/@types/snapshot'
import type { UpdateStatus } from '@/@types/system'
import { FieldRow } from '@/components/layout/field-row'
import { Panel } from '@/components/layout/panel'
import { PanelHeader } from '@/components/layout/panel-header'
import { LinkButton } from '@/components/link-button'
import { Button } from '@/components/ui/button'
import { updateLine } from '@/helpers/wording'
import { checkUpdate, installUpdate, openAboutLink } from '@/lib/multifus'

type ProjectPanelProps = Readonly<{
  update: UpdateStatus
  run: (action: Promise<Snapshot>) => void
}>

export const ProjectPanel = ({ update, run }: ProjectPanelProps) => {
  const isChecking = update.kind === 'checking'
  const hasUpdate = update.kind === 'available' || update.kind === 'installing'
  const isBusy = isChecking || update.kind === 'installing'

  return (
    <Panel className="mb-3">
      <PanelHeader
        title={t`Le projet`}
        description={t`Gratuit, sans compte et sans publicité.`}
      />
      <FieldRow
        label={t`Mise à jour`}
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
          {hasUpdate ? t`Installer` : t`Vérifier`}
        </Button>
      </FieldRow>
      <FieldRow
        label={t`Comment Multifus est développé`}
        description={t`Le code est public, rien n’est caché.`}
        icon={<CodeXml className="size-glyph" strokeWidth={1.75} aria-hidden />}
      >
        <LinkButton
          label={t`Aller voir`}
          onOpen={() => {
            return openAboutLink('source')
          }}
        />
      </FieldRow>
      <FieldRow
        label={t`Signaler un problème`}
        description={t`Un bug, une idée : c’est ici que ça se raconte.`}
        icon={<Bug className="size-glyph" strokeWidth={1.75} aria-hidden />}
      >
        <LinkButton
          label={t`Aller le dire`}
          onOpen={() => {
            return openAboutLink('issues')
          }}
        />
      </FieldRow>
    </Panel>
  )
}
