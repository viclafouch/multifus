import React from 'react'
import { Ban } from 'lucide-react'
import type { Color } from '@/@types/roster'
import { ColorSwatch } from '@/components/color-swatch'
import { Legend } from '@/components/layout/legend'
import { COLORS, COLOR_TINTS } from '@/constants/colors'
import { strings } from '@/constants/strings'
import type { ColorHolders } from '@/helpers/colors'
import { holderOf } from '@/helpers/colors'
import { colorReadout } from '@/helpers/wording'

const NO_COLOR = 'none'

type Near = Color | typeof NO_COLOR | null

type ColorGridProps = Readonly<{
  nickname: string
  color: Color | null
  takenColors: ColorHolders
  onPickColor: (color: Color | null) => void
}>

export const ColorGrid = ({
  nickname,
  color,
  takenColors,
  onPickColor
}: ColorGridProps) => {
  const words = strings.characters
  const [near, setNear] = React.useState<Near>(null)

  const holderOfColor = (candidate: Color | null) => {
    if (candidate === null) {
      return null
    }

    return holderOf(takenColors, { color: candidate, besides: nickname })
  }

  const nears = (candidate: Color | typeof NO_COLOR) => {
    return (isNear: boolean) => {
      setNear(isNear ? candidate : null)
    }
  }

  const shown = readColor(near, color)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <Legend>{words.dialogColors}</Legend>
        <span aria-hidden className="truncate text-note text-muted-foreground">
          {colorReadout(shown, holderOfColor(shown))}
        </span>
      </div>
      <ul className="flex flex-wrap gap-0.5">
        {COLORS.map((candidate) => {
          const holder = holderOfColor(candidate)

          return (
            <li key={candidate}>
              <ColorSwatch
                tint={COLOR_TINTS[candidate]}
                isWorn={color === candidate}
                isNear={near === candidate}
                isTaken={holder !== null}
                isBare={false}
                label={
                  holder === null
                    ? words.colorLabel(nickname, words.colors[candidate])
                    : words.colorTakenLabel({
                        nickname,
                        label: words.colors[candidate],
                        holder
                      })
                }
                onPick={() => {
                  onPickColor(candidate)
                }}
                onNear={nears(candidate)}
              />
            </li>
          )
        })}
        <li>
          <ColorSwatch
            tint="tint-none"
            isWorn={color === null}
            isNear={near === NO_COLOR}
            isTaken={false}
            isBare
            label={words.noColorLabel(nickname)}
            onPick={() => {
              onPickColor(null)
            }}
            onNear={nears(NO_COLOR)}
          >
            <Ban aria-hidden className="size-3.5" strokeWidth={1.75} />
          </ColorSwatch>
        </li>
      </ul>
    </div>
  )
}

const readColor = (near: Near, worn: Color | null) => {
  if (near === null) {
    return worn
  }

  return near === NO_COLOR ? null : near
}
