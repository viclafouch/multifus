import { t } from '@lingui/core/macro'
import { WheelDial } from '@/components/wheel-dial'
import { useWarmPortraits } from '@/hooks/use-warm-portraits'
import { useWheelStep } from '@/hooks/use-wheel-step'

export const WheelWindow = () => {
  const step = useWheelStep()

  useWarmPortraits()

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      {step === null ? null : (
        <WheelDial
          diameter={step.diameter}
          deadZone={step.deadZone}
          slices={step.slices}
          hovered={step.hovered}
          nobody={t`Personne de connecté`}
        />
      )}
    </div>
  )
}
