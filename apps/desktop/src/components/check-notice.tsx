import { t } from '@lingui/core/macro'
import { NoticeBar } from '@/components/notice-bar'
import { Button } from '@/components/ui/button'

type CheckNoticeProps = Readonly<{
  onOpen: () => void
  onDismiss: () => void
}>

export const CheckNotice = ({ onOpen, onDismiss }: CheckNoticeProps) => {
  return (
    <NoticeBar
      title={t`L’AutoFocus ne peut pas marcher`}
      body={t`Un réglage du système empêche le jeu de vous appeler.`}
      onDismiss={onDismiss}
      actions={
        <Button variant="outline" size="xs" onClick={onOpen}>
          {t`Régler`}
        </Button>
      }
    />
  )
}
