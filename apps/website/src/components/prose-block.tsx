import React from 'react'

type ProseBlockProps = Readonly<{
  level: 2 | 3
  title: string
  children: React.ReactNode
}>

export const ProseBlock = ({ level, title, children }: ProseBlockProps) => {
  const Heading = level === 2 ? 'h2' : 'h3'

  return (
    <section className="rule flex flex-col gap-3 border-t pt-6">
      <Heading className="font-carve text-action tracking-wide text-cream uppercase">
        {title}
      </Heading>
      {children}
    </section>
  )
}
