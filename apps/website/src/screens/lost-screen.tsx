import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import { PageLink } from '@/components/page-link'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { SkipLink } from '@/components/skip-link'
import { CONTENT_ANCHOR } from '@/constants/site'

const LOST_TITLE = msg`Cette page n’existe pas`

const LOST_PROMISE = msg`L’adresse est peut-être mal recopiée, ou la page a changé de nom. L’accueil vous remet sur le chemin.`

const BACK_HOME = msg`Retour à l’accueil`

export const LostScreen = () => {
  const { i18n } = useLingui()

  return (
    <div className="relative flex min-h-screen flex-col">
      <SkipLink />
      <SiteHeader />
      <main
        id={CONTENT_ANCHOR}
        tabIndex={-1}
        className="mx-auto flex w-full max-w-world flex-1 flex-col items-start gap-8 px-4 py-16 outline-none"
      >
        <h1 className="font-carve text-chapter tracking-hero text-cream uppercase">
          {i18n._(LOST_TITLE)}
        </h1>
        <p className="max-w-lead text-motto text-balance">
          {i18n._(LOST_PROMISE)}
        </p>
        <PageLink page="home" className="text-way">
          {i18n._(BACK_HOME)}
        </PageLink>
      </main>
      <SiteFooter />
    </div>
  )
}
