import React from 'react'
import { t } from '@lingui/core/macro'
import type { Display } from '@/@types/display'
import type { WheelSize } from '@/@types/wheel'
import { ScreenFrame } from '@/components/layout/screen-frame'
import { WheelDial } from '@/components/wheel-dial'
import { drawnWheel } from '@/helpers/wheel'

type WheelDrawingProps = Readonly<{
  screen: Display | null
  size: WheelSize
  crowd: number
}>

export const WheelDrawing = ({ screen, size, crowd }: WheelDrawingProps) => {
  const [aimed, setAimed] = React.useState<number | null>(null)
  const drawn = drawnWheel({ screen, size })
  const slices = size.demo.slice(0, crowd)
  const hovered = aimed !== null && aimed < slices.length ? aimed : null

  return (
    <div className="flex justify-center">
      <ScreenFrame
        ratio={drawn.ratio}
        width={drawn.drawnWidth}
        label={t`La roue au milieu de votre écran`}
        className="flex items-center justify-center"
      >
        <WheelDial
          diameter={drawn.drawnDiameter}
          deadZone={size.deadZone}
          slices={slices}
          hovered={hovered}
          onAim={setAimed}
        />
      </ScreenFrame>
    </div>
  )
}
