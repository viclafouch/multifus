import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import type { PageScreenProps } from '@/@types/screen'
import { AnkamaSources } from '@/components/ankama-sources'
import { Band } from '@/components/band'
import { BandTitle } from '@/components/band-title'
import { DownloadButton } from '@/components/download-button'
import { Opening } from '@/components/opening'
import { OutLink } from '@/components/out-link'
import { PageHead } from '@/components/page-head'
import { PageKin } from '@/components/page-kin'
import { PlateBlock } from '@/components/plate-block'
import { Prose } from '@/components/prose'
import { ProseBlock } from '@/components/prose-block'
import { ProvenanceList } from '@/components/provenance-list'
import { PAGES } from '@/constants/pages'
import { ANKAMA_FOLDER } from '@/constants/site'
import { formatDate } from '@/helpers/day'

const TERMS_READ_ON = '2026-09-05'

const OPENING = msg`Chaque image de Multifus vient d’Ankama, et aucune n’est là par hasard. Cette page dit laquelle vient d’où, ce qu’on refuse de prendre, et ce qui arrive à ces images le jour où Ankama demande leur retrait.`

const FROM_ANKAMA = msg`Ce qui vient d’Ankama`

const FOLDER_ASIDE = msg`Les fichiers sont tous rangés dans un seul dossier du dépôt, et cette liste en est la table.`

const FOLDER_LINK = msg`Voir le dossier sur GitHub`

const NEVER_TITLE = msg`Ce qu’on ne prend jamais`

const NEVER_CLIENT = msg`Aucun fichier du jeu installé. Le client pose sur votre disque des milliers d’icônes d’objets et de sorts, et Multifus n’en ouvre pas une. Ankama ne tolère les gestionnaires de fenêtres qu’à la condition qu’ils ne touchent jamais aux fichiers du jeu, et c’est cette phrase-là qui fait vivre le projet.`

const NEVER_HARVEST = msg`Aucune collecte automatique. Les conditions d’utilisation d’Ankama qualifient le moissonnage de leurs sites de contrefaçon, et c’est un mot qu’on prend au sérieux : le relevé a été fait à la main, page par page, et il n’a gardé que des adresses.`

const NEVER_SOURCES = msg`Cette limite, Ankama l’a posée deux fois en public, et il vaut mieux la lire chez eux que nous croire sur parole :`

const CREDIT_TITLE = msg`Créditer ne donne aucun droit`

const CREDIT_MORAL = msg`Écrire le nom d’Ankama sous une image ne donne pas le droit de la poser là. En droit français, nommer l’auteur satisfait son droit moral, jamais le droit de reproduire, qui est celui qu’il faudrait avoir. Gratuit n’y change rien non plus : le droit d’auteur ne connaît pas d’exception pour l’usage gratuit.`

const CREDIT_TERMS = msg`Les conditions d’utilisation de Dofus Retro demandent une autorisation écrite pour toute reproduction, et prévoient qu’Ankama peut autoriser la diffusion de sites de fans à sa seule discrétion. Multifus n’a pas cette autorisation, et ne se présente nulle part comme un outil approuvé par Ankama.`

const FOLDER_TITLE = msg`Pourquoi elles vivent toutes au même endroit`

const FOLDER_MIT = msg`Le code de Multifus est sous licence MIT : n’importe qui peut le copier, le modifier et même le vendre. Ce droit-là se donne sur du code qu’on a écrit, jamais sur une image qu’on n’a pas faite. Les images sont donc rassemblées dans un seul dossier, que la licence exclut nommément, et aucune autre partie du dépôt n’en contient.`

const FOLDER_REMOVAL = msg`Une seule commande retire ce dossier en entier. C’est ce qui rend la promesse tenable plutôt que polie : le jour où Ankama le demande, il n’y a rien à trier et rien à négocier.`

const OURS_TITLE = msg`Ce qui est dessiné ici`

const OURS_MATTER = msg`Tout le reste de ce que vous voyez est à nous : les couleurs, le bois, les boutons, les ombres, la façon dont une fenêtre est taillée. Un style graphique ne se protège pas, une image si, et c’est toute la différence entre s’inspirer d’un univers et se servir dedans.`

const OURS_PHISHING = msg`Jamais le logo de Dofus, jamais sa typographie, jamais le vert et l’orange de l’en-tête d’Ankama. Plusieurs sites se font déjà passer pour eux pour faire installer n’importe quoi, et un site de fan qui imite leur bandeau devient indiscernable de ceux-là.`

const LIMIT_TITLE = msg`Ce que cette page ne vous donne pas`

const LIMIT_RIGHTS = msg`Aucun droit sur ces images. Elles restent celles d’Ankama, et cette page dit seulement laquelle vient d’où et comment elles sont rangées. Vous n’avez pas plus le droit de les reprendre après les avoir vues ici qu’avant.`

const LIMIT_REMOVAL = msg`Le jour où Ankama demande leur retrait, elles partent toutes en même temps. Les fenêtres perdraient leur fond, la roue ses portraits de classe et ce site ses vidéos : il y aurait à redessiner, jamais à réécrire.`

export const ImagesScreen = ({ page }: PageScreenProps) => {
  const { i18n } = useLingui()
  const { kin } = PAGES[page]
  const readOn = formatDate({ day: TERMS_READ_ON, locale: i18n.locale })

  return (
    <>
      <Band className="pb-6">
        <PageHead page={page} />
        <Opening>{i18n._(OPENING)}</Opening>
      </Band>
      <Band className="reveal gap-4 py-0">
        <BandTitle>{i18n._(FROM_ANKAMA)}</BandTitle>
        <ProvenanceList />
        <p className="max-w-tale text-aside text-band">
          {i18n._(FOLDER_ASIDE)}{' '}
          <OutLink href={ANKAMA_FOLDER}>{i18n._(FOLDER_LINK)}</OutLink>
        </p>
      </Band>
      <Band className="reveal pt-12">
        <ProseBlock level={2} title={i18n._(NEVER_TITLE)}>
          <Prose>{i18n._(NEVER_CLIENT)}</Prose>
          <Prose>{i18n._(NEVER_SOURCES)}</Prose>
          <AnkamaSources />
          <Prose>{i18n._(NEVER_HARVEST)}</Prose>
        </ProseBlock>
        <ProseBlock level={2} title={i18n._(CREDIT_TITLE)}>
          <Prose>{i18n._(CREDIT_MORAL)}</Prose>
          <Prose>{i18n._(CREDIT_TERMS)}</Prose>
          <p className="text-aside text-band">
            {i18n._(msg`Conditions d’utilisation lues le ${{ readOn }}.`)}
          </p>
        </ProseBlock>
        <ProseBlock level={2} title={i18n._(FOLDER_TITLE)}>
          <Prose>{i18n._(FOLDER_MIT)}</Prose>
          <Prose>{i18n._(FOLDER_REMOVAL)}</Prose>
        </ProseBlock>
        <ProseBlock level={2} title={i18n._(OURS_TITLE)}>
          <Prose>{i18n._(OURS_MATTER)}</Prose>
          <Prose>{i18n._(OURS_PHISHING)}</Prose>
        </ProseBlock>
      </Band>
      <Band className="reveal pt-0">
        <PlateBlock title={i18n._(LIMIT_TITLE)}>
          <Prose>{i18n._(LIMIT_RIGHTS)}</Prose>
          <Prose>{i18n._(LIMIT_REMOVAL)}</Prose>
        </PlateBlock>
      </Band>
      <PageKin pages={kin} />
      <Band className="pb-20">
        <DownloadButton />
      </Band>
    </>
  )
}
