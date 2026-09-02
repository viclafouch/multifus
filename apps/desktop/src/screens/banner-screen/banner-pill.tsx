import { Footprints } from 'lucide-react'
import type { BannerStep } from '@/@types/walk'
import { CharacterMedallion } from '@/components/character-medallion'
import { ColorStripe } from '@/components/color-stripe'
import { CORNER_PLACEMENT } from '@/constants/banner'
import { strings } from '@/constants/strings'
import { portraitFor } from '@/helpers/portrait'
import { cn } from '@/lib/utils'

type BannerPillProps = Readonly<{
  step: BannerStep
}>

export const BannerPill = ({ step }: BannerPillProps) => {
  const placement = CORNER_PLACEMENT[step.corner]

  return (
    <div className={cn('flex h-screen w-screen p-2.5', placement.anchor)}>
      <div className="banner-pill flex max-w-full items-center gap-2.5 rounded-full border border-primary/30 bg-background/92 py-1 pr-3.5 pl-2">
        <Footprints
          aria-hidden
          strokeWidth={1.9}
          className="size-4 shrink-0 text-primary"
        />
        {step.character === null ? (
          <span className="pr-0.5 text-row font-medium whitespace-nowrap text-muted-foreground">
            {step.previewing
              ? strings.walk.banner.previewing
              : strings.walk.banner.waiting}
          </span>
        ) : (
          <span
            key={step.character.nickname}
            data-from={placement.fromLeft ? 'left' : 'right'}
            className="step flex min-w-0 items-center gap-2.5"
          >
            {step.character.color === null ? null : (
              <ColorStripe
                color={step.character.color}
                className="h-medallion"
              />
            )}
            <CharacterMedallion
              portrait={portraitFor(step.character)}
              state="live"
            />
            <span className="truncate text-row font-medium">
              {step.character.nickname}
            </span>
          </span>
        )}
      </div>
    </div>
  )
}
