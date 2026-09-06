import { t } from '@lingui/core/macro'
import type { Character } from '@/@types/roster'
import { MainMark } from '@/components/main-mark'
import { KeyStone } from '@/components/world/key-stone'
import { PORTRAIT_UNKNOWN } from '@/constants/classes'
import { COLOR_TINTS } from '@/constants/colors'
import { portraitFor } from '@/helpers/portrait'
import { characterState, characterSubLine } from '@/helpers/wording'
import { cn } from '@/lib/utils'

type HeadProps = Readonly<{
  character: Character
  onOpen: () => void
}>

export const Head = ({ character, onOpen }: HeadProps) => {
  const { nickname, color, main, shortcut } = character
  const portrait = portraitFor(character)
  const line = characterSubLine(character)

  return (
    <button
      type="button"
      aria-label={`${nickname} · ${line}`}
      onClick={onOpen}
      className="group/head sighted relative flex flex-col items-center gap-1 rounded-md p-0.5"
    >
      {main ? (
        <MainMark
          isMain
          className="relief absolute top-0 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 ring-1 ring-iron"
        />
      ) : null}
      <span
        aria-hidden
        data-state={characterState(character)}
        className="head flex size-head items-center justify-center overflow-hidden rounded-full"
      >
        {portrait === null ? (
          <span className="font-carve text-bar leading-none text-khaki">
            {PORTRAIT_UNKNOWN}
          </span>
        ) : (
          <img src={portrait} alt="" className="size-full object-cover" />
        )}
      </span>
      {color === null ? null : (
        <span
          aria-hidden
          className={cn('stripe h-1 w-6 rounded-full', COLOR_TINTS[color])}
        />
      )}
      <span
        aria-hidden
        className="hood pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 flex w-max max-w-48 -translate-x-1/2 flex-col items-center gap-1 rounded-md px-3 py-2 opacity-0 transition-opacity duration-200 group-hover/head:opacity-100 group-focus-visible/head:opacity-100"
      >
        <span className="max-w-full truncate font-carve text-bar tracking-wide text-cream uppercase">
          {nickname}
        </span>
        <span className="text-center text-mark text-khaki">{line}</span>
        {shortcut === null ? null : <KeyStone accelerator={shortcut} />}
        {main ? (
          <span className="text-mark text-khaki-lit">{t`Principal`}</span>
        ) : null}
      </span>
    </button>
  )
}
