import React from 'react'
import type { Icon } from '@phosphor-icons/react'
import { Plate } from '@/components/plate'
import { Prose } from '@/components/prose'

type MarkPlateProps = Readonly<{
  Mark: Icon
  title: string
  lead: string
  children?: React.ReactNode
}>

export const MarkPlate = ({ Mark, title, lead, children }: MarkPlateProps) => {
  return (
    <Plate isBare className="flex-row items-start gap-6 sm:p-8">
      <span className="rosette">
        <Mark weight="duotone" aria-hidden />
      </span>
      <div className="flex min-w-0 flex-col items-start gap-3">
        <h2 className="nameplate">{title}</h2>
        <Prose>{lead}</Prose>
        {children}
      </div>
    </Plate>
  )
}
