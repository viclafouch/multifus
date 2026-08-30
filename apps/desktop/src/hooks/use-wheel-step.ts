import React from 'react'
import type { WheelStep } from '@/@types/wheel'
import { useWheelWiped } from '@/hooks/use-wheel-wiped'
import { onWheelAim, onWheelStep, onWheelWipe, wheelStep } from '@/lib/multifus'
import { ignore } from '@/lib/utils'

export const useWheelStep = () => {
  const [step, setStep] = React.useState<WheelStep | null>(null)
  const [wipedGeneration, setWipedGeneration] = React.useState<number | null>(
    null
  )

  useWheelWiped(wipedGeneration)

  React.useEffect(() => {
    let isLive = true
    let hasHeardRust = false
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
            hasHeardRust = true

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
      keep(
        await onWheelWipe((generation) => {
          if (isLive) {
            hasHeardRust = true

            setStep(null)
            setWipedGeneration(generation)
          }
        })
      )

      const first = await wheelStep()

      if (isLive && !hasHeardRust) {
        setStep(first)
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
