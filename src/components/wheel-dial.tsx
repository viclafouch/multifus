import type { WheelSlice } from '@/@types/wheel'
import { WheelHead } from '@/components/wheel-head'
import { DIAL_BOX, DIAL_RADIUS } from '@/constants/wheel'
import { portraitFor } from '@/helpers/portrait'
import { dialShape, headPlace, slicePath } from '@/helpers/wheel'

const VIEW_BOX = `${-DIAL_BOX / 2} ${-DIAL_BOX / 2} ${DIAL_BOX} ${DIAL_BOX}`

type WheelDialProps = Readonly<{
  diameter: number
  deadZone: number
  slices: readonly WheelSlice[]
  hovered: number | null
  nobody?: string
  onAim?: (hovered: number | null) => void
}>

export const WheelDial = ({
  diameter,
  deadZone,
  slices,
  hovered,
  nobody,
  onAim
}: WheelDialProps) => {
  const count = slices.length
  const shape = dialShape({ diameter, deadZone, count })
  const here = slices.find((slice) => {
    return slice.here
  })
  const face = here === undefined ? null : portraitFor(here)

  return (
    <div
      style={{ width: diameter, height: diameter }}
      className="wheel-glass relative shrink-0 select-none"
    >
      <svg
        aria-hidden
        viewBox={VIEW_BOX}
        onPointerLeave={
          onAim === undefined
            ? undefined
            : () => {
                onAim(null)
              }
        }
        className="absolute inset-0 size-full"
      >
        <circle r={DIAL_RADIUS} className="wheel-plate" />
        {slices.map((slice, index) => {
          return (
            <path
              key={slice.nickname}
              d={slicePath({ index, count, inner: shape.inner })}
              fillRule="evenodd"
              data-here={slice.here ? '' : undefined}
              data-hovered={index === hovered ? '' : undefined}
              onPointerEnter={
                onAim === undefined
                  ? undefined
                  : () => {
                      onAim(index)
                    }
              }
              className="wheel-slice"
            />
          )
        })}
        <circle r={shape.inner} className="wheel-hub" />
      </svg>
      {slices.map((slice, index) => {
        const place = headPlace({ index, count, ring: shape.ring })

        return (
          <span
            key={slice.nickname}
            style={{
              transform: `translate(calc(-50% + ${place.x}px), calc(-50% + ${place.y}px))`
            }}
            className="pointer-events-none absolute top-1/2 left-1/2 flex"
          >
            <WheelHead
              slice={slice}
              shape={shape}
              isHovered={index === hovered}
            />
          </span>
        )
      })}
      <span
        style={{ width: shape.hub, height: shape.hub }}
        className="wheel-face pointer-events-none absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full"
      >
        {face === null ? null : (
          <img alt="" src={face} className="size-full object-cover" />
        )}
      </span>
      {count === 0 && nobody !== undefined ? (
        <p
          style={{ fontSize: shape.nobody, maxWidth: shape.nobodyWidth }}
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center font-display leading-tight font-semibold text-balance text-muted-foreground"
        >
          {nobody}
        </p>
      ) : null}
    </div>
  )
}
