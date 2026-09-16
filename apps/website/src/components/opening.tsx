import React from 'react'

type OpeningProps = Readonly<{
  children: React.ReactNode
}>

export const Opening = ({ children }: OpeningProps) => {
  return (
    <p className="lede max-w-saga pl-6 text-herald text-cream">{children}</p>
  )
}
