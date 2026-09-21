import { t } from '@lingui/core/macro'
import type { Snapshot } from '@/@types/snapshot'
import { NoticeBar } from '@/components/notice-bar'
import { authorizationNoticeLines } from '@/helpers/wording'
import { requestAuthorization } from '@/lib/multifus'

type AuthorizationBannerProps = Readonly<{
  run: (action: Promise<Snapshot>) => void
}>

export const AuthorizationBanner = ({ run }: AuthorizationBannerProps) => {
  const { title, body } = authorizationNoticeLines()

  return (
    <NoticeBar
      level="alarm"
      title={title}
      body={body}
      actionLabel={t`Demander l’autorisation`}
      onAct={() => {
        run(requestAuthorization())
      }}
    />
  )
}
