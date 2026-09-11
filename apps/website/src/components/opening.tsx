import React from 'react'

type OpeningProps = Readonly<{
  children: React.ReactNode
}>

export const Opening = ({ children }: OpeningProps) => {
  return (
    <p className="rule max-w-tale border-l pl-4 text-tale text-cream">
      {children}
    </p>
  )
}
