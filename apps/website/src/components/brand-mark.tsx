import logo from '@multifus/retro/assets/logo.png'
import { PageLink } from '@/components/page-link'

const LOGO_SIDE = 256

type BrandMarkProps = Readonly<{
  onGo?: () => void
}>

export const BrandMark = ({ onGo }: BrandMarkProps) => {
  return (
    <PageLink
      page="home"
      isBare
      onClick={onGo}
      className="sighted flex items-center gap-2.5 font-carve text-bar tracking-micro text-cream lg:text-action lg:tracking-chapter"
    >
      <img
        src={logo}
        alt=""
        width={LOGO_SIDE}
        height={LOGO_SIDE}
        className="emblem size-8 lg:size-9"
      />
      Multifus
    </PageLink>
  )
}
