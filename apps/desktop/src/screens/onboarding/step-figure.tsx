import { i18n } from '@lingui/core'
import { t } from '@lingui/core/macro'
import type { Page } from '@/@types/onboarding'
import { PAGE_ICONS, PAGE_SHOTS } from '@/constants/onboarding'

type StepFigureProps = Readonly<{
  page: Page
}>

export const StepFigure = ({ page }: StepFigureProps) => {
  const shot = PAGE_SHOTS[page]
  const Icon = PAGE_ICONS[page]

  if (shot !== null) {
    const alt = i18n._(shot.alt)

    return (
      <figure className="step-band flex items-center justify-center rounded-xl border border-border bg-card/45 p-2.5">
        <img
          src={shot.crop}
          alt={alt}
          className="max-h-full max-w-full rounded-sm object-contain"
        />
      </figure>
    )
  }

  return (
    <figure className="step-band flex flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-border bg-card/20">
      <Icon
        aria-hidden
        className="size-mark shrink-0 text-muted-foreground/35"
        strokeWidth={1.4}
      />
      <figcaption className="font-mono text-micro tracking-micro text-muted-foreground/45 uppercase">
        {t`Image à venir`}
      </figcaption>
    </figure>
  )
}
