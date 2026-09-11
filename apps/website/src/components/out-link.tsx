import React from 'react'

type OutLinkProps = Readonly<{
  href: string
  children: React.ReactNode
}>

export const OutLink = ({ href, children }: OutLinkProps) => {
  return (
    <a
      href={href}
      className="sighted rule border-b text-cream transition-colors hover:border-cream"
    >
      {children}
    </a>
  )
}
