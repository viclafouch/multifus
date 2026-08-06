import React from 'react'
import { cn } from '@/lib/utils'

type ScreenProps = Readonly<{
  title: string
  subtitle?: string
  children: React.ReactNode
}>

/**
 * The frame every screen sits in.
 *
 * The title is the one place Fraunces speaks, at a size where its warmth reads.
 * The header does not scroll away, so the screen one is on is never in doubt.
 */
export const Screen = ({ title, subtitle, children }: ScreenProps) => {
  return (
    <section className="flex min-h-full flex-col">
      <header className="flex flex-col gap-2 px-7 pt-6 pb-5">
        <h1 className="font-display text-title font-semibold tracking-title">
          {title}
        </h1>
        {subtitle === undefined ? null : (
          <p className="max-w-prose text-body text-muted-foreground">
            {subtitle}
          </p>
        )}
      </header>
      <div className="flex-1 px-7 pb-8">{children}</div>
    </section>
  )
}

/**
 * Derived rather than written out, so that a caller can hang a `data-*` on the
 * surface and style it with a modifier instead of a class built at runtime.
 */
type PanelProps = Readonly<React.ComponentProps<'div'>>

/** A bordered surface. The only container this interface has. */
export const Panel = ({ className, children, ...rest }: PanelProps) => {
  return (
    <div
      {...rest}
      className={cn('rounded-xl border border-border bg-card/45', className)}
    >
      {children}
    </div>
  )
}

type FieldRowProps = Readonly<{
  label: string
  description: string
  /** A glyph in a bordered tile, for a list whose rows need telling apart. */
  icon?: React.ReactNode
  children: React.ReactNode
}>

/**
 * One setting: what it is on the left, what it is set to on the right.
 *
 * The shortcuts and the seven AutoFocus switches are both lists of settings, so
 * they are both this row. Only the AutoFocus rows carry an icon, which is why it
 * is optional rather than a second component.
 *
 * The description says what the setting gives the user when it is on, in one
 * line. Not how multifus goes about it, which is nobody's business, and not what
 * happens when it is off, which is the same sentence backwards.
 */
export const FieldRow = ({
  label,
  description,
  icon,
  children
}: FieldRowProps) => {
  return (
    <div className="flex items-center gap-4 border-b border-border/70 px-4 py-3.5 last:border-b-0">
      {icon === undefined ? null : <IconTile>{icon}</IconTile>}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-row font-medium">{label}</p>
        <p className="text-note text-muted-foreground">{description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  )
}

type PanelHeaderProps = Readonly<{
  title: string
  description: string
}>

/**
 * The heading of a panel whose body is a list rather than a row of settings.
 *
 * The sibling of {@link SectionRow} with nothing on the right: a section row is
 * a subject with an action next to it, this is a subject that introduces what
 * comes underneath. Extracted the moment a second panel wanted one, so that two
 * panels of the same screen cannot drift a pixel apart.
 */
export const PanelHeader = ({ title, description }: PanelHeaderProps) => {
  return (
    <div className="flex flex-col gap-1 border-b border-border/70 px-4 py-3.5">
      <h2 className="text-row font-medium">{title}</h2>
      <p className="max-w-prose text-note text-muted-foreground">
        {description}
      </p>
    </div>
  )
}

type SectionRowProps = Readonly<{
  title: string
  description: string
  children: React.ReactNode
}>

/**
 * One subject of a screen: what it is on the left, what one can do about it on
 * the right.
 *
 * The sibling of {@link FieldRow} and not the same component. A field row is a
 * setting, its label names a value and what sits on the right is that value; a
 * section row is a subject, it carries a heading and a paragraph, and what sits
 * on the right is an action that goes off and does something.
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
        <p className="max-w-prose text-note text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </section>
  )
}

type IconTileProps = Readonly<{
  children: React.ReactNode
}>

/** The bordered square a glyph sits in, wherever one is needed. */
export const IconTile = ({ children }: IconTileProps) => {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border/60 bg-background/50 text-muted-foreground">
      {children}
    </span>
  )
}

type NoteProps = Readonly<{
  children: React.ReactNode
}>

/** A quiet aside: a caveat that matters but must not shout. */
export const Note = ({ children }: NoteProps) => {
  return (
    <p className="mt-4 max-w-prose border-l-2 border-border pl-3 text-note text-muted-foreground/85">
      {children}
    </p>
  )
}

type EmptyStateProps = Readonly<{
  title: string
  body: string
  hint?: string
  mark?: React.ReactNode
  children: React.ReactNode
}>

/**
 * The dashed panel a screen shows instead of its content.
 *
 * Two screens need it and they need it identical: the roster nobody has filled
 * yet, and the roster the system will not let multifus read.
 */
export const EmptyState = ({
  title,
  body,
  hint,
  mark,
  children
}: EmptyStateProps) => {
  return (
    <div className="flex min-h-empty flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-border px-8 py-14 text-center">
      {mark === undefined ? null : mark}
      <h2 className="font-display text-heading font-semibold tracking-title">
        {title}
      </h2>
      <p className="max-w-blurb text-body text-muted-foreground">{body}</p>
      {hint === undefined ? null : (
        <p className="max-w-blurb text-note text-muted-foreground/70">{hint}</p>
      )}
      <div className="mt-3 flex items-center gap-2">{children}</div>
    </div>
  )
}
