import React from 'react'
import { Ban } from 'lucide-react'
import { i18n } from '@lingui/core'
import { t } from '@lingui/core/macro'
import type { Color } from '@/@types/roster'
import { ColorSwatch } from '@/components/color-swatch'
import { Legend } from '@/components/layout/legend'
import { COLORS, COLOR_TINTS } from '@/constants/colors'
import { COLOR_LABELS } from '@/constants/roster'
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
        <Legend>{t`Couleur`}</Legend>
        <span aria-hidden className="truncate text-note text-muted-foreground">
          {colorReadout(shown, holderOfColor(shown))}
        </span>
      </div>
      <ul className="flex flex-wrap gap-0.5">
        {COLORS.map((candidate) => {
          const holder = holderOfColor(candidate)
          const label = i18n._(COLOR_LABELS[candidate])

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
                    ? t`Marquer ${nickname} en ${label}`
                    : t`Marquer ${nickname} en ${label}, déjà pris par ${holder}`
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
            label={t`Retirer la couleur de ${nickname}`}
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
