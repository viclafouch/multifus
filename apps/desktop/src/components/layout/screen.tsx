import React from 'react'

type ScreenProps = Readonly<{
  title: string
  subtitle?: string
  children: React.ReactNode
}>

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
