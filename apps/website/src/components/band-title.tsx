import React from 'react'
import { cn } from '@multifus/retro'
import { Glint } from '@/components/glint'

type TitleSize = 'band' | 'passage'

const TITLE_SIZES = {
  band: 'text-chapter',
  passage: 'text-passage'
} as const satisfies Record<TitleSize, string>

type BandTitleProps = Readonly<{
  children: React.ReactNode
  size?: TitleSize
}>

export const BandTitle = ({ children, size = 'band' }: BandTitleProps) => {
  return (
    <h2 className="flex flex-col gap-3.5">
      <span className={cn('carved', TITLE_SIZES[size])}>{children}</span>
      <Glint />
    </h2>
  )
}
