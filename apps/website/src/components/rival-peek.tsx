import { msg } from '@lingui/core/macro'
import { useLingui } from '@lingui/react'
import { Button } from '@multifus/retro'
import { PageLink } from '@/components/page-link'
import { RivalTable } from '@/components/rival-table'
import { TRAIT_IDS } from '@/constants/rivals'

export const RivalPeek = () => {
  const { i18n } = useLingui()
  const rows = TRAIT_IDS.length

  return (
    <div className="lure">
      <RivalTable isPeek />
      <Button
        variant="slate"
        nativeButton={false}
        render={
          <PageLink
            page="comparison"
            isBare
            className="sighted absolute bottom-6 left-1/2 z-3 -translate-x-1/2"
          />
        }
      >
        {i18n._(msg`Voir les ${{ rows }} lignes du comparatif`)}
      </Button>
    </div>
  )
}
