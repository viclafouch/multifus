import { t } from '@lingui/core/macro'
import type { AboutLink } from '@/@types/about'
import { LinkButton } from '@/components/link-button'
import { Button } from '@/components/retro/button'
import { ShotSheet } from '@/components/shot-sheet'
import { Dialog, DialogClose, DialogTrigger } from '@/components/ui/dialog'
import { openAboutLink } from '@/lib/multifus'

type ToleranceShotProps = Readonly<{
  shot: string
  source: string
  link: AboutLink
}>

export const ToleranceShot = ({ shot, source, link }: ToleranceShotProps) => {
  return (
    <Dialog>
      <DialogTrigger
        render={<button type="button" aria-label={t`Lire ${source}`} />}
        className="stage group relative block w-full text-left"
      >
        <img
          src={shot}
          alt=""
          className="aspect-loop block w-full object-cover object-top"
        />
        <span className="plaque absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 px-3 py-2 text-aside supports-backdrop-filter:backdrop-blur-sm">
          <span className="min-w-0 truncate">{source}</span>
          <span className="shrink-0 font-carve text-mark tracking-widest uppercase group-hover:text-cream">
            {t`Lire`}
          </span>
        </span>
      </DialogTrigger>
      <ShotSheet alt={source}>
        <div className="frame pointer-events-auto relative min-w-0 rounded-sm p-2">
          <img
            src={shot}
            alt={source}
            className="block max-h-shot max-w-full object-contain"
          />
          <div className="plaque absolute inset-x-2 bottom-2 flex items-center justify-between gap-4 px-3 py-2 supports-backdrop-filter:backdrop-blur-sm">
            <p className="min-w-0 text-aside">{source}</p>
            <div className="flex shrink-0 items-center gap-2">
              <LinkButton
                label={t`Ouvrir la source`}
                onOpen={() => {
                  return openAboutLink(link)
                }}
              />
              <DialogClose render={<Button variant="slate" size="sm" />}>
                {t`Fermer`}
              </DialogClose>
            </div>
          </div>
        </div>
      </ShotSheet>
    </Dialog>
  )
}
