import React from 'react'
import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import { cn } from '@multifus/retro'
import { ArrowUpRightIcon } from '@phosphor-icons/react/dist/ssr/ArrowUpRight'
import { MAIL_SCHEME } from '@/constants/site'

const NEW_TAB_HINT = msg`nouvel onglet`

const NEW_TAB = {
  target: '_blank',
  rel: 'noopener'
} as const satisfies Pick<React.ComponentProps<'a'>, 'rel' | 'target'>

type OutLinkProps = Readonly<{
  href: string
  children: React.ReactNode
  className?: string
  isInline?: boolean
  isBare?: boolean
}>

export const OutLink = ({
  href,
  children,
  className,
  isInline = false,
  isBare = false
}: OutLinkProps) => {
  const { i18n } = useLingui()
  const isMailed = href.startsWith(MAIL_SCHEME)

  return (
    <a
      href={href}
      {...(isMailed ? null : NEW_TAB)}
      className={
        isBare
          ? className
          : cn(
              'sighted rule border-b text-cream transition-colors hover:border-cream',
              isInline ? 'inline' : 'inline-flex items-center gap-1.5',
              className
            )
      }
    >
      {children}
      {isBare ? null : (
        <ArrowUpRightIcon
          weight="bold"
          aria-hidden
          className={cn('size-[0.9em]', isInline ? 'ml-1 inline' : null)}
        />
      )}
      {isMailed ? null : (
        <span className="sr-only"> ({i18n._(NEW_TAB_HINT)})</span>
      )}
    </a>
  )
}
