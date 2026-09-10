import { t } from '@lingui/core/macro'
import { NoticeBar } from '@/components/notice-bar'

type CheckNoticeProps = Readonly<{
  onOpen: () => void
  onDismiss: () => void
}>

export const CheckNotice = ({ onOpen, onDismiss }: CheckNoticeProps) => {
  return (
    <NoticeBar
      title={t`L’AutoFocus ne peut pas marcher`}
      body={t`Un réglage du système empêche le jeu de vous appeler.`}
      actionLabel={t`Régler`}
      onAct={onOpen}
      onDismiss={onDismiss}
    />
  )
}
