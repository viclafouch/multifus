import React from 'react'

type OpeningProps = Readonly<{
  children: React.ReactNode
}>

export const Opening = ({ children }: OpeningProps) => {
  return (
    <p className="max-w-tale border-l-2 border-leaf/50 pl-6 text-herald text-cream">
      {children}
    </p>
  )
}
