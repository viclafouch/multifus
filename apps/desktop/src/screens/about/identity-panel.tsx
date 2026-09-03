import React from 'react'
import { t } from '@lingui/core/macro'
import { CopyButton } from '@/components/copy-button'
import { Panel } from '@/components/layout/panel'
import { RevealButton } from '@/components/reveal-button'
import { revealConfig } from '@/lib/multifus'

type FactProps = Readonly<{
  label: string
  value: string
  children?: React.ReactNode
}>

const Fact = ({ label, value, children }: FactProps) => {
  return (
    <div className="flex items-start gap-6">
      <dt className="w-28 shrink-0 pt-px text-muted-foreground">{label}</dt>
      <dd className="selectable min-w-0 flex-1 font-mono text-note break-all text-foreground/80">
        {value}
      </dd>
      {children === undefined ? null : (
        <div className="flex shrink-0 items-center">{children}</div>
      )}
    </div>
  )
}

type IdentityPanelProps = Readonly<{
  version: string
  system: string
  configPath: string
}>

export const IdentityPanel = ({
  version,
  system,
  configPath
}: IdentityPanelProps) => {
  return (
    <Panel className="mb-3">
      <div className="flex flex-col gap-2.5 px-4 py-4">
        <p className="flex items-baseline gap-2.5 font-display text-heading font-semibold tracking-title">
          <span
            aria-hidden
            className="size-1.5 shrink-0 -translate-y-1 rounded-full bg-primary"
          />
          Multifus
        </p>
        <p className="max-w-prose text-body text-muted-foreground">
          {t`Le multicompte confortable sur Dofus Retro : Multifus range vos fenêtres, vous jouez.`}
        </p>
      </div>
      <dl className="flex flex-col gap-2 border-t border-border/70 px-4 py-3.5 text-body">
        <Fact label={t`Version`} value={version} />
        <Fact label={t`Système`} value={system} />
        <Fact label={t`Vos réglages`} value={configPath}>
          <CopyButton
            text={configPath}
            label={t`Copier le chemin`}
            copiedLabel={t`Chemin copié`}
          />
          <RevealButton
            label={t`Montrer le fichier des réglages`}
            onReveal={revealConfig}
          />
        </Fact>
      </dl>
    </Panel>
  )
}
