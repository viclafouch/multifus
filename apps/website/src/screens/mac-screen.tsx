import type { PageScreenProps } from '@/@types/screen'
import { PageBody } from '@/components/page-body'
import { PageKin } from '@/components/page-kin'
import { SystemStage } from '@/components/system-stage'
import { PAGE_BODIES } from '@/constants/bodies'
import { PAGES } from '@/constants/pages'
import { MAC_SHOT, MAC_SHOT_ALT } from '@/constants/shots'

export const MacScreen = ({ page }: PageScreenProps) => {
  const { kin } = PAGES[page]
  const body = PAGE_BODIES[page]

  return (
    <>
      <SystemStage page={page} shot={MAC_SHOT} alt={MAC_SHOT_ALT} />
      {body === null ? null : <PageBody body={body} />}
      {kin.length === 0 ? null : <PageKin pages={kin} />}
    </>
  )
}
