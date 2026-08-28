import React from 'react'
import type { WheelStep } from '@/@types/wheel'
import { onWheelAim, onWheelStep, wheelStep } from '@/lib/multifus'
import { ignore } from '@/lib/utils'

export const useWheelStep = () => {
  const [step, setStep] = React.useState<WheelStep | null>(null)

  React.useEffect(() => {
    let isLive = true
    const stops: (() => void)[] = []

    const keep = (stop: () => void) => {
      if (isLive) {
        stops.push(stop)
      } else {
        stop()
      }
    }

    const subscribe = async () => {
      keep(
        await onWheelStep((next) => {
          if (isLive) {
            setStep(next)
          }
        })
      )
      keep(
        await onWheelAim((hovered) => {
          if (isLive) {
            setStep((current) => {
              return current === null ? current : { ...current, hovered }
            })
          }
        })
      )

      const first = await wheelStep()

      if (isLive) {
        setStep((current) => {
          return current ?? first
        })
      }
    }

    subscribe().catch(ignore)

    return () => {
      isLive = false

      for (const stop of stops) {
        stop()
      }
    }
  }, [])

  return step
}
