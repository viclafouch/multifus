import React from 'react'
import { cn } from '@multifus/retro'

type PlateProps = Readonly<
  React.ComponentProps<'div'> & {
    isBare?: boolean
  }
>

export const Plate = ({
  className,
  isBare = false,
  children,
  ...rest
}: PlateProps) => {
  return (
    <div
      {...rest}
      data-bare={isBare ? true : undefined}
      className={cn('slab flex flex-col gap-4 p-6 sm:p-7', className)}
    >
      {children}
    </div>
  )
}
