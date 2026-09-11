import React from 'react'

const FLAGS = {
  fr: (
    <>
      <rect width="20" height="40" fill="#002654" />
      <rect x="20" width="20" height="40" fill="#f2f2f2" />
      <rect x="40" width="20" height="40" fill="#ce1126" />
    </>
  ),
  en: (
    <>
      <rect width="60" height="40" fill="#012169" />
      <path d="M0 0 60 40M60 0 0 40" stroke="#f2f2f2" strokeWidth="8" />
      <path d="M0 0 60 40M60 0 0 40" stroke="#c8102e" strokeWidth="4" />
      <path d="M30 0V40M0 20H60" stroke="#f2f2f2" strokeWidth="13" />
      <path d="M30 0V40M0 20H60" stroke="#c8102e" strokeWidth="8" />
    </>
  ),
  es: (
    <>
      <rect width="60" height="40" fill="#aa151b" />
      <rect y="10" width="60" height="20" fill="#f1bf00" />
    </>
  )
} as const satisfies Record<string, React.JSX.Element>

export type FlagLanguage = keyof typeof FLAGS

type FlagProps = Readonly<{
  language: FlagLanguage
}>

export const Flag = ({ language }: FlagProps) => {
  return (
    <svg viewBox="0 0 60 40" aria-hidden className="size-full">
      {FLAGS[language]}
    </svg>
  )
}
