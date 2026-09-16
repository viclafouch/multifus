import React from 'react'
import type { MessageDescriptor } from '@lingui/core'
import { useLingui } from '@lingui/react'

type NavGroupProps = Readonly<{
  title: MessageDescriptor
  children: React.ReactNode
}>

export const NavGroup = ({ title, children }: NavGroupProps) => {
  const { i18n } = useLingui()
  const named = React.useId()

  return (
    <nav aria-labelledby={named} className="flex flex-col gap-3.5">
      <p id={named} className="rubric text-khaki">
        {i18n._(title)}
      </p>
      <ul className="flex flex-col gap-0.5">{children}</ul>
    </nav>
  )
}
