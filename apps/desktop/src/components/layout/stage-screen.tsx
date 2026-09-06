import React from 'react'
import { MapHeader } from '@/components/layout/map-header'
import { LoopStage } from '@/components/world/loop-stage'

type StageScreenProps = Readonly<{
  title: string
  subtitle: string
  caption: string
  loop: string | null
  children: React.ReactNode
}>

export const StageScreen = ({
  title,
  subtitle,
  caption,
  loop,
  children
}: StageScreenProps) => {
  return (
    <section className="settle mx-auto flex min-h-full w-full max-w-world flex-col gap-4 pt-20 pb-hem">
      <MapHeader title={title} subtitle={subtitle} />
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <LoopStage source={loop} caption={caption} />
        </div>
        <div className="flex w-side shrink-0 flex-col gap-3">{children}</div>
      </div>
    </section>
  )
}
