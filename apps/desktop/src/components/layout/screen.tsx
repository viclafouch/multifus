import React from 'react'
import { MapHeader } from '@/components/layout/map-header'

type ScreenProps = Readonly<{
  title: string
  subtitle?: string
  children: React.ReactNode
}>

export const Screen = ({ title, subtitle, children }: ScreenProps) => {
  return (
    <section className="settle mx-auto flex min-h-full w-full max-w-roll flex-col gap-4 pt-fall pb-fall">
      <MapHeader title={title} subtitle={subtitle} />
      {children}
    </section>
  )
}
