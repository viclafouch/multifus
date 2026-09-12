import React from 'react'
import { useLingui } from '@lingui/react'
import type { Point as PointShape } from '@/@types/body'

type PointProps = Readonly<{
  point: PointShape
  children?: React.ReactNode
}>

export const Point = ({ point, children }: PointProps) => {
  const { i18n } = useLingui()

  return (
    <li className="flex max-w-tale flex-col gap-3 text-tale text-band">
      <span>
        <strong className="font-medium text-cream">{i18n._(point.lead)}</strong>{' '}
        {i18n._(point.line)}
      </span>
      {children}
    </li>
  )
}
