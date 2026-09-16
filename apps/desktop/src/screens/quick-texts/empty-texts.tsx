import { t } from '@lingui/core/macro'
import { Button } from '@multifus/retro'
import { KeyCap } from '@/components/key-cap'
import { EmptyState } from '@/components/layout/empty-state'
import { acceleratorParts } from '@/helpers/accelerator'

const EXAMPLE_ACCELERATOR = 'Control+Alt+KeyB'

type EmptyTextsProps = Readonly<{
  handleAdd: () => void
}>

export const EmptyTexts = ({ handleAdd }: EmptyTextsProps) => {
  return (
    <EmptyState
      title={t`Aucun texte rangé`}
      body={t`Un texte, des touches, et vous ne le retapez plus de la soirée.`}
      mark={<TextMark />}
    >
      <Button variant="slate" size="sm" onClick={handleAdd}>
        {t`Ajouter un texte`}
      </Button>
    </EmptyState>
  )
}

const TextMark = () => {
  return (
    <span aria-hidden className="dimmed mb-2 flex items-center gap-4">
      <span className="flex items-center gap-1">
        {acceleratorParts(EXAMPLE_ACCELERATOR).map((part) => {
          return <KeyCap key={part} token={part} />
        })}
      </span>
      <span className="text-tale text-khaki">{t`Bon jeu à toi !`}</span>
    </span>
  )
}
