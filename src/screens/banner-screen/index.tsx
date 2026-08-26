import { useBannerStep } from '@/hooks/use-banner-step'
import { BannerPill } from '@/screens/banner-screen/banner-pill'

export const Banner = () => {
  const step = useBannerStep()

  if (step === null) {
    return null
  }

  return <BannerPill step={step} />
}
