import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import type { PageScreenProps } from '@/@types/screen'
import { AnkamaSources } from '@/components/ankama-sources'
import { Band } from '@/components/band'
import { BandTitle } from '@/components/band-title'
import { DownloadPair } from '@/components/download-pair'
import { OutLink } from '@/components/out-link'
import { PageHead } from '@/components/page-head'
import { PageKin } from '@/components/page-kin'
import { Prose } from '@/components/prose'
import { ProseBlock } from '@/components/prose-block'
import { PAGES } from '@/constants/pages'
import { REPOSITORY } from '@/constants/site'
import {
  BEFORE_INSTALL,
  LIMITS_TITLE,
  NO_HARM,
  ONE_AT_A_TIME
} from '@/constants/wording'

const BEFORE_LEAD = msg`Ce marché est plein de clones, et vous avez raison de vous méfier. Voici les quatre choses que vous pouvez vérifier vous-même, avant même de double-cliquer.`

const SIGNED_TITLE = msg`Le paquet est signé et notarisé`

const SIGNED_BODY = msg`Sur Mac, le .dmg est signé par un identifiant de développeur Apple et notarisé par Apple : il s’ouvre sans avertissement, et le système vous dira qui l’a construit. Aucun autre outil de multicompte Dofus Retro ne le fait aujourd’hui.`

const ATTESTATION_TITLE = msg`Chaque paquet porte son attestation`

const ATTESTATION_BODY = msg`GitHub signe chaque paquet publié et dit de quel commit et de quel dépôt il sort. Une coquille ne peut pas montrer ça. La commande rend un verdict, et elle ne demande rien d’autre que le fichier que vous venez de télécharger :`

const ATTESTATION_COMMAND = msg`gh attestation verify <fichier> --repo viclafouch/multifus`

const LIMITS_SOURCES = msg`Ankama a posé cette limite deux fois en public, et c’est elle qui tient le projet :`

const SOURCE_TITLE = msg`Le code est publié`

const SOURCE_BODY = msg`Tout ce que Multifus fait se lit ligne par ligne, sous licence MIT. Vous pouvez le compiler vous-même et comparer.`

const SOURCE_NAME = msg`Le dépôt sur GitHub`

export const DownloadScreen = ({ page }: PageScreenProps) => {
  const { i18n } = useLingui()
  const { kin } = PAGES[page]

  return (
    <>
      <Band className="pb-8">
        <PageHead page={page} />
        <DownloadPair />
      </Band>
      <Band className="reveal pt-4">
        <BandTitle>{i18n._(BEFORE_INSTALL)}</BandTitle>
        <Prose>{i18n._(BEFORE_LEAD)}</Prose>
        <ProseBlock level={3} title={i18n._(SIGNED_TITLE)}>
          <Prose>{i18n._(SIGNED_BODY)}</Prose>
        </ProseBlock>
        <ProseBlock level={3} title={i18n._(ATTESTATION_TITLE)}>
          <Prose>{i18n._(ATTESTATION_BODY)}</Prose>
          <code className="glass block max-w-tale overflow-x-auto px-4 py-3 font-mono text-aside text-cream">
            {i18n._(ATTESTATION_COMMAND)}
          </code>
        </ProseBlock>
        <ProseBlock level={3} title={i18n._(LIMITS_TITLE)}>
          <Prose>{i18n._(NO_HARM)}</Prose>
          <Prose>{i18n._(ONE_AT_A_TIME)}</Prose>
          <Prose>{i18n._(LIMITS_SOURCES)}</Prose>
          <AnkamaSources />
        </ProseBlock>
        <ProseBlock level={3} title={i18n._(SOURCE_TITLE)}>
          <Prose>{i18n._(SOURCE_BODY)}</Prose>
          <p className="text-tale">
            <OutLink href={REPOSITORY}>{i18n._(SOURCE_NAME)}</OutLink>
          </p>
        </ProseBlock>
      </Band>
      <PageKin pages={kin} />
    </>
  )
}
