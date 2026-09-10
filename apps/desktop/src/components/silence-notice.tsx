import { t } from '@lingui/core/macro'
import { NoticeBar } from '@/components/notice-bar'

type SilenceNoticeProps = Readonly<{
  onOpen: () => void
  onDismiss: () => void
}>

export const SilenceNotice = ({ onOpen, onDismiss }: SilenceNoticeProps) => {
  return (
    <NoticeBar
      title={t`Multifus n’a rien entendu depuis longtemps`}
      body={t`Il écoute, l’AutoFocus est allumé, et aucune notification ne lui est parvenue. Reprenez la mise en route : un réglage a pu changer sans le dire.`}
      actionLabel={t`Vérifier`}
      onAct={onOpen}
      onDismiss={onDismiss}
    />
  )
}
