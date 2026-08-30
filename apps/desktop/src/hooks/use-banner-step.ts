import React from 'react'
import type { BannerStep } from '@/@types/walk'
import { bannerStep, onBannerStep } from '@/lib/multifus'
import { ignore } from '@/lib/utils'

export const useBannerStep = () => {
  const [step, setStep] = React.useState<BannerStep | null>(null)

  React.useEffect(() => {
    let isLive = true
    let unlisten: (() => void) | null = null

    const subscribe = async () => {
      const stop = await onBannerStep((next) => {
        if (isLive) {
          setStep(next)
        }
      })

      if (isLive) {
        unlisten = stop
      } else {
        stop()
      }

      const first = await bannerStep()

      if (isLive) {
        setStep((current) => {
          return current ?? first
        })
      }
    }

    subscribe().catch(ignore)

    return () => {
      isLive = false
      unlisten?.()
    }
  }, [])

  return step
}
