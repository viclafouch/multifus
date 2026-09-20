import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import { Trans } from '@lingui/react/macro'
import type { PageScreenProps } from '@/@types/screen'
import { Band } from '@/components/band'
import { OutLink } from '@/components/out-link'
import { PageHead } from '@/components/page-head'
import { Prose } from '@/components/prose'
import { ProseBlock } from '@/components/prose-block'
import {
  ANKAMA,
  AUTHOR,
  AUTHOR_CODE,
  FOLD_ANCHOR,
  GAME,
  REPOSITORY,
  VERCEL,
  VERCEL_ADDRESS,
  VERCEL_ANALYTICS,
  VERCEL_NAME
} from '@/constants/site'

const PUBLISHER_TITLE = msg`Qui publie le site`

const HOSTING_TITLE = msg`Qui l’héberge`

const PRIVACY_TITLE = msg`Ce que le site garde de vous`

const MARKS_TITLE = msg`Les marques qui ne sont pas les nôtres`

export const LegalScreen = ({ page }: PageScreenProps) => {
  const { i18n } = useLingui()

  return (
    <>
      <Band id={FOLD_ANCHOR} className="pt-12 pb-8">
        <PageHead page={page} />
      </Band>
      <Band className="reveal gap-8 pb-20">
        <ProseBlock level={2} title={i18n._(PUBLISHER_TITLE)}>
          <Prose isWide>
            <Trans>
              Multifus est publié par{' '}
              <OutLink isInline href={AUTHOR_CODE}>
                viclafouch
              </OutLink>
              , un particulier, à titre personnel, hors de toute société, et
              sans rien vendre. Son identité est connue de l’hébergeur, comme la
              loi le demande.
            </Trans>
          </Prose>
          <Prose isWide>
            <Trans>
              On lui écrit sur son{' '}
              <OutLink isInline href={AUTHOR}>
                compte X
              </OutLink>
              , et nulle part ailleurs. C’est par là que passent une erreur du
              comparatif et une faute de traduction.
            </Trans>
          </Prose>
          <Prose isWide>
            <Trans>
              Le{' '}
              <OutLink isInline href={REPOSITORY}>
                code du site
              </OutLink>{' '}
              est public.
            </Trans>
          </Prose>
        </ProseBlock>
        <ProseBlock level={2} title={i18n._(HOSTING_TITLE)}>
          <Prose isWide>
            <Trans>
              Le site est hébergé par{' '}
              <OutLink isInline href={VERCEL}>
                {VERCEL_NAME}
              </OutLink>
              , {VERCEL_ADDRESS}, aux États-Unis.
            </Trans>
          </Prose>
          <Prose isWide>
            <Trans>
              Les pages sont construites à l’avance et servies telles quelles,
              sans base de données et sans compte.
            </Trans>
          </Prose>
        </ProseBlock>
        <ProseBlock level={2} title={i18n._(PRIVACY_TITLE)}>
          <Prose isWide>
            <Trans>
              Aucun cookie n’est posé, ni par le site, ni par la mesure
              d’audience. Il n’y a donc rien à accepter.
            </Trans>
          </Prose>
          <Prose isWide>
            <Trans>
              Votre navigateur ne garde qu’une chose : que la proposition de
              lire le site dans votre langue vous a déjà été montrée. Elle ne
              quitte pas votre machine, et vider les données du site l’efface.
            </Trans>
          </Prose>
          <Prose isWide>
            <Trans>
              L’audience est comptée sans vous nommer.{' '}
              <OutLink isInline href={VERCEL_ANALYTICS}>
                Vercel Analytics
              </OutLink>{' '}
              compte les pages vues et les téléchargements, sans identifiant,
              sans profil, et sans vous suivre d’un site à l’autre.
            </Trans>
          </Prose>
        </ProseBlock>
        <ProseBlock level={2} title={i18n._(MARKS_TITLE)}>
          <Prose isWide>
            <Trans>
              Dofus, Dofus Retro et Ankama appartiennent à{' '}
              <OutLink isInline href={ANKAMA}>
                Ankama Games
              </OutLink>
              . Les images et les vidéos du site viennent du{' '}
              <OutLink isInline href={GAME}>
                jeu
              </OutLink>{' '}
              et restent à eux.
            </Trans>
          </Prose>
          <Prose isWide>
            <Trans>
              Multifus n’a aucun lien avec Ankama : ni partenariat, ni
              approbation, ni soutien d’aucune sorte.
            </Trans>
          </Prose>
        </ProseBlock>
      </Band>
    </>
  )
}
