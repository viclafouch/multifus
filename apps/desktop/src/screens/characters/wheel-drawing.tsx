import React from 'react'
import { t } from '@lingui/core/macro'
import type { Display } from '@/@types/display'
import type { WheelSize } from '@/@types/wheel'
import { ScreenFrame } from '@/components/layout/screen-frame'
import { WheelDial } from '@/components/wheel-dial'
import { drawnWheel } from '@/helpers/wheel'
import { useBoxWidth } from '@/hooks/use-box-width'

type WheelDrawingProps = Readonly<{
  screen: Display | null
  size: WheelSize
  crowd: number
}>

export const WheelDrawing = ({ screen, size, crowd }: WheelDrawingProps) => {
  const [aimed, setAimed] = React.useState<number | null>(null)
  const { box, width } = useBoxWidth()
  const drawn = drawnWheel({ screen, size, boxWidth: width })
  const slices = size.demo.slice(0, crowd)
  const hovered = aimed !== null && aimed < slices.length ? aimed : null

  return (
    <ScreenFrame
      ref={box}
      ratio={drawn.ratio}
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
  )
}
