import logo from '@multifus/retro/assets/logo.png'
import { PageLink } from '@/components/page-link'

const LOGO_SIDE = 256

export const BrandMark = () => {
  return (
    <PageLink
      page="home"
      isBare
      className="sighted flex items-center gap-2.5 font-carve text-action tracking-chapter text-cream"
    >
      <img
        src={logo}
        alt=""
        width={LOGO_SIDE}
        height={LOGO_SIDE}
        className="emblem size-9"
      />
      Multifus
    </PageLink>
  )
}
