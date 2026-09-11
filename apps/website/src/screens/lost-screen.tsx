import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import { Band } from '@/components/band'
import { PageLink } from '@/components/page-link'
import { SiteShell } from '@/components/site-shell'

const LOST_TITLE = msg`Cette page n’existe pas`

const LOST_PROMISE = msg`L’adresse est peut-être mal recopiée, ou la page a changé de nom. L’accueil vous remet sur le chemin.`

const BACK_HOME = msg`Retour à l’accueil`

export const LostScreen = () => {
  const { i18n } = useLingui()

  return (
    <SiteShell>
      <Band className="pb-20">
        <h1 className="font-carve text-banner tracking-hero text-cream uppercase">
          {i18n._(LOST_TITLE)}
        </h1>
        <p className="max-w-lead text-herald text-balance">
          {i18n._(LOST_PROMISE)}
        </p>
        <PageLink page="home" className="text-way">
          {i18n._(BACK_HOME)}
        </PageLink>
      </Band>
    </SiteShell>
  )
}
