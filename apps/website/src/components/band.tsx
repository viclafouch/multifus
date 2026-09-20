import React from 'react'
import { cn } from '@multifus/retro'

type BandProps = Readonly<React.ComponentProps<'section'>>

export const Band = ({ className, children, ...rest }: BandProps) => {
  return (
    <section
      {...rest}
      className={cn(
        'gutter mx-auto flex w-full max-w-world flex-col gap-6 py-rest',
        className
      )}
    >
      {children}
    </section>
  )
}
