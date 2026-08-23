import React from 'react'

type SectionRowProps = Readonly<{
  title: string
  description: string
  children: React.ReactNode
}>

/**
 * One subject of a screen: what it is on the left, what one can do about it on
 * the right. A `FieldRow` is a setting, this is a subject and an action.
 */
export const SectionRow = ({
  title,
  description,
  children
}: SectionRowProps) => {
  return (
    <section className="flex items-center gap-5 px-4 py-3.5">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2 className="text-row font-medium">{title}</h2>
        {/* `text-pretty` and not a shorter sentence: it is what keeps a last
            word from landing alone on a line of its own. */}
        <p className="max-w-prose text-pretty text-note text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </section>
  )
}
