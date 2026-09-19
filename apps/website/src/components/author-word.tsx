import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import authorFace from '@/assets/author.webp'
import { OutLink } from '@/components/out-link'
import { PageLink } from '@/components/page-link'
import { AUTHOR_LOGIN, REPOSITORY } from '@/constants/site'
import { PAGE_NAMES } from '@/constants/wording'

const FACE_SIDE = 256

const AUTHOR_TRADE = msg`Développeur web depuis 10 ans`

const AUTHOR_FACE_ALT = msg`L’image de profil de l’auteur de Multifus.`

const AUTHOR_WORD = msg`Je fais du web depuis 10 ans, et je sais ce qu’on risque en installant un logiciel trouvé sur un Discord. Multifus ne voit jamais votre mot de passe, parce qu’il ne fait que ranger vos fenêtres de Dofus Retro. Son code est public, libre à vous d’aller le vérifier.`

const SOURCE = msg`Voir le code`

export const AuthorWord = () => {
  const { i18n } = useLingui()

  return (
    <div className="grid gap-9 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start lg:gap-14">
      <div className="flex items-center gap-5 lg:flex-col lg:items-start lg:gap-5">
        <img
          src={authorFace}
          alt={i18n._(AUTHOR_FACE_ALT)}
          width={FACE_SIDE}
          height={FACE_SIDE}
          loading="lazy"
          decoding="async"
          className="cameo size-20 shrink-0 lg:size-28"
        />
        <span className="flex flex-col gap-1.5">
          <span className="nameplate">{AUTHOR_LOGIN}</span>
          <span className="text-aside text-khaki">{i18n._(AUTHOR_TRADE)}</span>
        </span>
      </div>
      <div className="lede flex flex-col gap-9 pl-6 lg:pl-12">
        <p className="text-herald leading-snug text-cream sm:text-passage">
          {i18n._(AUTHOR_WORD)}
        </p>
        <ul className="flex flex-wrap items-center gap-x-8 gap-y-3 text-aside">
          <li>
            <OutLink href={REPOSITORY}>{i18n._(SOURCE)}</OutLink>
          </li>
          <li>
            <PageLink page="ankama" className="rule border-b text-cream">
              {i18n._(PAGE_NAMES.ankama)}
            </PageLink>
          </li>
        </ul>
      </div>
    </div>
  )
}
