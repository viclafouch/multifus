import type { Language } from '@/@types/language'
import { LanguagePicker } from '@/components/language-picker'

type LanguageBarProps = Readonly<{
  version: string
  language: Language
}>

export const LanguageBar = ({ version, language }: LanguageBarProps) => {
  return (
    <div className="absolute top-3 right-6 z-40 flex h-crown items-center gap-2.5">
      <p className="limelight text-mark text-khaki/55">v{version}</p>
      <LanguagePicker current={language} />
    </div>
  )
}
