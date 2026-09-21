import { msg } from '@lingui/core/macro'
import { BugIcon } from '@phosphor-icons/react/dist/ssr/Bug'
import { GithubLogoIcon } from '@phosphor-icons/react/dist/ssr/GithubLogo'
import { SwordIcon } from '@phosphor-icons/react/dist/ssr/Sword'
import { XLogoIcon } from '@phosphor-icons/react/dist/ssr/XLogo'
import type { Signpost } from '@/@types/signpost'
import { AUTHOR, GAME, ISSUES, REPOSITORY } from '@/constants/site'

export const HELP_LINKS = [
  {
    href: ISSUES,
    name: msg`Signaler un problème`,
    Mark: BugIcon
  },
  {
    href: REPOSITORY,
    name: msg`Le code sur GitHub`,
    Mark: GithubLogoIcon
  },
  {
    href: AUTHOR,
    name: msg`Me contacter`,
    Mark: XLogoIcon
  }
] as const satisfies readonly Signpost[]

export const ELSEWHERE_LINKS = [
  ...HELP_LINKS,
  {
    href: GAME,
    name: msg`Le site de Dofus Retro`,
    Mark: SwordIcon
  }
] as const satisfies readonly Signpost[]
