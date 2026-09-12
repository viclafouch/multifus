import React from 'react'
import { cn } from '@multifus/retro'
import { Link } from '@tanstack/react-router'
import type { Language } from '@/@types/language'
import type { PageId } from '@/@types/page'
import { PAGES } from '@/constants/pages'
import { useLanguage } from '@/hooks/use-language'

const HOME_ROUTES = {
  fr: '/',
  en: '/en',
  es: '/es'
} as const satisfies Record<Language, string>

const SLUG_ROUTES = {
  fr: '/$slug',
  en: '/en/$slug',
  es: '/es/$slug'
} as const satisfies Record<Language, string>

type PageLinkProps = Readonly<
  Omit<React.ComponentProps<'a'>, 'href'> & {
    page: PageId
    language?: Language
    isBare?: boolean
  }
>

export const PageLink = ({
  page,
  language,
  isBare = false,
  className,
  children,
  ...rest
}: PageLinkProps) => {
  const reading = useLanguage()
  const spoken = language ?? reading
  const slug = PAGES[page].slugs[spoken]
  const shared = {
    ...rest,
    activeOptions: { exact: true },
    className: isBare
      ? className
      : cn('sighted transition-colors hover:text-cream', className),
    children
  }

  return slug === '' ? (
    <Link {...shared} to={HOME_ROUTES[spoken]} />
  ) : (
    <Link {...shared} to={SLUG_ROUTES[spoken]} params={{ slug }} />
  )
}
