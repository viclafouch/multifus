import React from 'react'

type TaleProps = Readonly<{
  children: React.ReactNode
}>

export const Tale = ({ children }: TaleProps) => {
  return (
    <p className="relative max-w-tale self-center px-8 py-5 text-center text-tale text-balance text-khaki-lit">
      <span aria-hidden className="legible absolute -inset-x-4 -inset-y-2" />
      <span className="relative">{children}</span>
    </p>
  )
}
