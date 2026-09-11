import React from 'react'

type TaleProps = Readonly<{
  children: React.ReactNode
}>

export const Tale = ({ children }: TaleProps) => {
  return (
    <p className="relative w-full max-w-lintel self-center px-16 py-4 text-center text-motto text-balance text-cream">
      <span aria-hidden className="lintel absolute inset-0" />
      <span
        aria-hidden
        className="crest absolute top-0 left-0 w-full -translate-y-1/2"
      />
      <span className="engraved relative">{children}</span>
    </p>
  )
}
