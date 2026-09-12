import React from 'react'
import { t } from '@lingui/core/macro'
import { Panel } from '@multifus/retro'
import logo from '@multifus/retro/assets/logo.png'
import { CopyButton } from '@/components/copy-button'
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
      <dt className="w-28 shrink-0 pt-px text-khaki">{label}</dt>
      <dd className="selectable min-w-0 flex-1 font-mono text-aside wrap-anywhere text-cream/80">
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
    <Panel>
      <div className="flex flex-col gap-3 px-4 py-4">
        <div className="flex items-center gap-3.5">
          <img src={logo} alt="" className="emblem size-emblem shrink-0" />
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="limelight font-carve text-action tracking-wide text-cream uppercase">
              Multifus
            </p>
            <p className="limelight text-aside text-khaki-lit">
              {t`Logiciel communautaire pour Dofus Retro`}
            </p>
          </div>
        </div>
        <p className="max-w-tale text-tale text-khaki">
          {t`Le multicompte sur Dofus Retro, sans quitter le jeu des yeux. Vos fenêtres passent devant au clavier, à la roue des personnages ou au clic, et celle qui vous appelle arrive toute seule. Un raccourci colle une réponse rapide, un autre pose le tableau des runes, et vos messages privés vous rejoignent sur votre téléphone si vous reliez Telegram.`}
        </p>
      </div>
      <dl className="flex flex-col gap-2 border-t border-band/25 px-4 py-3.5 text-tale">
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
