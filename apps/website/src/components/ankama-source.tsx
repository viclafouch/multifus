import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import { ArrowUpRightIcon } from '@phosphor-icons/react/dist/ssr/ArrowUpRight'
import type { AnkamaSourceId } from '@/@types/ankama'
import { OutLink } from '@/components/out-link'
import { ANKAMA_SOURCES } from '@/constants/ankama'

const OPEN_SOURCE = msg`Ouvrir la source`

type AnkamaSourceProps = Readonly<{
  source: AnkamaSourceId
}>

export const AnkamaSource = ({ source }: AnkamaSourceProps) => {
  const { i18n } = useLingui()
  const {
    icon: SourceIcon,
    name,
    date,
    alt,
    quote,
    shot,
    href
  } = ANKAMA_SOURCES[source]

  return (
    <li className="grid gap-5 md:row-span-2 md:grid-rows-subgrid">
      <span className="flex flex-col gap-1.5">
        <h3 className="nameplate flex items-center gap-2.5">
          <SourceIcon
            weight="duotone"
            aria-hidden
            className="size-6 shrink-0 text-leaf-lit"
          />
          {i18n._(name)}
        </h3>
        <span className="text-aside text-band">{i18n._(date)}</span>
      </span>
      <OutLink
        href={href}
        isBare
        className="proof stage sighted group self-start"
      >
        <img
          src={shot.src}
          alt={`${i18n._(alt)} « ${quote} »`}
          width={shot.width}
          height={shot.height}
          loading="lazy"
        />
        <span className="plaque absolute inset-x-0 bottom-0 flex items-center justify-end gap-1.5 px-4 py-2.5 font-carve text-legend tracking-wide uppercase transition-colors group-hover:text-cream">
          {i18n._(OPEN_SOURCE)}
          <ArrowUpRightIcon weight="bold" aria-hidden className="size-3.5" />
        </span>
      </OutLink>
    </li>
  )
}
