import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import { ProhibitIcon } from '@phosphor-icons/react/dist/ssr/Prohibit'
import { BAN_DECOR } from '@/constants/decors'
import { GUTTER, PAIR_FLOOR, sourcesOf, WIDE_FLOOR } from '@/lib/media'

const BAN_COLUMN = '66rem'

const PLATE_PAD = '3rem'

const WIDE_PLATE_PAD = '4rem'

const BAN_SIZES = [
  `(min-width: ${WIDE_FLOOR}) ${BAN_COLUMN}`,
  `(min-width: ${PAIR_FLOOR}) calc(100vw - ${GUTTER} - ${WIDE_PLATE_PAD})`,
  `calc(100vw - ${GUTTER} - ${PLATE_PAD})`
].join(', ')

const BOT_BAN_TITLE = msg`Ce n’est pas un bot`

const BOT_BAN_LINE = msg`Si vous cherchez à faire jouer vos personnages sans vous, Multifus ne le fera jamais : il amène leur fenêtre devant vous, et rien d’autre.`

export const BotBan = () => {
  const { i18n } = useLingui()

  return (
    <div className="ban flex items-start gap-4 p-5">
      <img
        src={BAN_DECOR.full.src}
        srcSet={sourcesOf(BAN_DECOR)}
        sizes={BAN_SIZES}
        alt=""
        width={BAN_DECOR.full.width}
        height={BAN_DECOR.full.height}
        loading="lazy"
        decoding="async"
        className="plane"
      />
      <ProhibitIcon weight="bold" aria-hidden />
      <div className="flex flex-col gap-1.5">
        <h3 className="nameplate text-flame">{i18n._(BOT_BAN_TITLE)}</h3>
        <p className="max-w-saga text-tale text-khaki">
          {i18n._(BOT_BAN_LINE)}
        </p>
      </div>
    </div>
  )
}
