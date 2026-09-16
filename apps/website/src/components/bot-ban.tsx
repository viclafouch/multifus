import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import battle from '@multifus/ankama/images/battle.webp'
import { ProhibitIcon } from '@phosphor-icons/react/dist/ssr/Prohibit'

const BOT_BAN_TITLE = msg`Ce n’est pas un bot`

const BOT_BAN_LINE = msg`Si vous cherchez à faire jouer vos personnages sans vous, Multifus ne le fera jamais : il amène leur fenêtre devant vous, et rien d’autre.`

export const BotBan = () => {
  const { i18n } = useLingui()

  return (
    <div className="ban flex items-start gap-4 p-5">
      <img src={battle} alt="" className="plane" />
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
