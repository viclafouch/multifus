import { useLingui } from '@lingui/react'
import { LOOPS } from '@/constants/loops'
import { MENU_FEATURES, PAGES } from '@/constants/pages'
import { PAGE_NAMES, PAGE_PROMISES } from '@/constants/wording'
import { pathOf } from '@/helpers/page'
import { useLanguage } from '@/hooks/use-language'

type VignetteProps = Readonly<{
  page: (typeof MENU_FEATURES)[number]
}>

export const Vignette = ({ page }: VignetteProps) => {
  const { i18n } = useLingui()
  const language = useLanguage()
  const { poster } = LOOPS[PAGES[page].loop]

  return (
    <a
      href={pathOf({ page, language })}
      className="card sighted flex h-full flex-col"
    >
      <img
        src={poster}
        alt=""
        loading="lazy"
        decoding="async"
        className="vignette"
      />
      <span className="nameplate px-5 pt-4">{i18n._(PAGE_NAMES[page])}</span>
      <span className="px-5 pt-1.5 pb-5 text-tale text-band">
        {i18n._(PAGE_PROMISES[page])}
      </span>
    </a>
  )
}
