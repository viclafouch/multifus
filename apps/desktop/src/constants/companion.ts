import type { CompanionSite } from '@/@types/companion'

export const COMPANION_SITES = [
  'dofusRetroTools',
  'solomonk'
] as const satisfies readonly CompanionSite[]

type CompanionSiteCard = {
  readonly name: string
  readonly host: string
}

export const COMPANION_SITE_CARDS = {
  dofusRetroTools: { name: 'Dofus Retro Tools', host: 'dofusretrotools.com' },
  solomonk: { name: 'Solomonk', host: 'solomonk.fr' }
} as const satisfies Record<CompanionSite, CompanionSiteCard>
