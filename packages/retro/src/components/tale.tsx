import React from 'react'

type TaleProps = Readonly<{
  children: React.ReactNode
}>

export const Tale = ({ children }: TaleProps) => {
  return (
    <p className="relative w-full max-w-lintel self-center px-16 py-4 text-center text-motto text-balance text-cream">
      <span aria-hidden className="lintel absolute inset-0" />
      <span aria-hidden className="seam" />
      <span className="engraved relative">{children}</span>
    </p>
  )
}
