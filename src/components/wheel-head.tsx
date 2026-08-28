import type { WheelSlice } from '@/@types/wheel'
import { MainStar } from '@/components/main-star'
import { PORTRAIT_UNKNOWN } from '@/constants/classes'
import { STAR_SHARE, UNKNOWN_SHARE } from '@/constants/wheel'
import { portraitFor } from '@/helpers/portrait'
import type { DialShape } from '@/helpers/wheel'

type WheelHeadProps = Readonly<{
  slice: WheelSlice
  shape: DialShape
  isHovered: boolean
}>

export const WheelHead = ({ slice, shape, isHovered }: WheelHeadProps) => {
  const portrait = portraitFor(slice)
  const star = shape.head * STAR_SHARE

  return (
    <span
      style={{ gap: shape.gap, maxWidth: shape.chord }}
      className="flex flex-col items-center"
    >
      <span
        data-hovered={isHovered ? '' : undefined}
        data-empty={portrait === null ? '' : undefined}
        style={{ width: shape.head, height: shape.head }}
        className="wheel-head relative flex shrink-0 rounded-full border-2 bg-card"
      >
        <span className="flex size-full items-center justify-center overflow-hidden rounded-full">
          {portrait === null ? (
            <span
              aria-hidden
              style={{ fontSize: shape.head * UNKNOWN_SHARE }}
              className="font-display leading-none font-semibold text-muted-foreground/70"
            >
              {PORTRAIT_UNKNOWN}
            </span>
          ) : (
            <img alt="" src={portrait} className="size-full object-cover" />
          )}
        </span>
        {slice.main ? (
          <span
            style={{ width: star, height: star }}
            className="absolute -top-0.5 -right-0.5 flex"
          >
            <MainStar isMain className="size-full" />
          </span>
        ) : null}
      </span>
      <span
        data-hovered={isHovered ? '' : undefined}
        style={{ fontSize: shape.label, maxWidth: shape.chord }}
        className="wheel-name w-full truncate text-center leading-none font-semibold"
      >
        {slice.nickname}
      </span>
    </span>
  )
}
