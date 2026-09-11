import React from 'react'

type ProseBlockProps = Readonly<{
  title: string
  children: React.ReactNode
}>

export const ProseBlock = ({ title, children }: ProseBlockProps) => {
  return (
    <section className="rule flex flex-col gap-3 border-t pt-6">
      <h3 className="font-carve text-action tracking-wide text-cream uppercase">
        {title}
      </h3>
      {children}
    </section>
  )
}
