import React from 'react'
import { Tale } from '@/components/layout/tale'

type MapHeaderProps = Readonly<{
  title: string
  subtitle?: string
  action?: React.ReactNode
}>

export const MapHeader = ({ title, subtitle, action }: MapHeaderProps) => {
  return (
    <>
      <h1 className="limelight self-center text-center font-carve text-sign tracking-wide text-balance text-cream uppercase">
        {title}
      </h1>
      <span aria-hidden className="crest self-center" />
      {subtitle === undefined ? null : <Tale>{subtitle}</Tale>}
      {action}
    </>
  )
}
