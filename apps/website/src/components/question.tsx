import React from 'react'
import type { MessageDescriptor } from '@lingui/core'
import { useLingui } from '@lingui/react'
import type { Icon } from '@phosphor-icons/react'

type QuestionProps = Readonly<{
  ask: MessageDescriptor
  icon: Icon
  children: React.ReactNode
}>

export const Question = ({ ask, icon: AskIcon, children }: QuestionProps) => {
  const { i18n } = useLingui()

  return (
    <details data-bare className="ask slab">
      <summary className="sighted">
        <span className="flex items-center gap-3.5">
          <AskIcon
            weight="duotone"
            aria-hidden
            className="size-6 text-leaf-lit"
          />
          <span className="font-carve text-bar tracking-wide text-cream uppercase">
            {i18n._(ask)}
          </span>
        </span>
        <span aria-hidden className="askmark" />
      </summary>
      <div className="answer flex flex-col gap-4 px-6 pt-5 pb-6 text-tale text-band">
        {children}
      </div>
    </details>
  )
}
