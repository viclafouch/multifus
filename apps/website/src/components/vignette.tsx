import { useLingui } from '@lingui/react'
import type { PageId } from '@/@types/page'
import { LOOPS } from '@/constants/loops'
import { PAGES } from '@/constants/pages'
import { PAGE_NAMES, PAGE_PROMISES } from '@/constants/wording'
import { pathOf } from '@/helpers/page'
import { useLanguage } from '@/hooks/use-language'

type VignetteProps = Readonly<{
  page: PageId
}>

export const Vignette = ({ page }: VignetteProps) => {
  const { i18n } = useLingui()
  const language = useLanguage()
  const { loop } = PAGES[page]

  return (
    <a
      href={pathOf({ page, language })}
      className="card sighted flex h-full flex-col"
    >
      {loop === null ? null : (
        <img
          src={LOOPS[loop].poster}
          alt=""
          loading="lazy"
          decoding="async"
          className="vignette"
        />
      )}
      <span className="nameplate px-5 pt-5">{i18n._(PAGE_NAMES[page])}</span>
      <span className="px-5 pt-1.5 pb-5 text-tale text-band">
        {i18n._(PAGE_PROMISES[page])}
      </span>
    </a>
  )
}
