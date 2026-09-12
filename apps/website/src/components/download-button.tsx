import { useLingui } from '@lingui/react'
import { Button } from '@multifus/retro'
import { PAGE_NAMES } from '@/constants/wording'
import { pathOf } from '@/helpers/page'
import { useLanguage } from '@/hooks/use-language'

export const DownloadButton = () => {
  const { i18n } = useLingui()
  const language = useLanguage()

  return (
    <Button
      variant="leaf"
      size="lead"
      nativeButton={false}
      className="self-start"
      render={
        /* oxlint-disable-next-line anchor-has-content, control-has-associated-label -- Base UI pose les enfants du Button dans ce lien, que les deux règles lisent vide */
        <a className="sighted" href={pathOf({ page: 'download', language })} />
      }
    >
      {i18n._(PAGE_NAMES.download)}
    </Button>
  )
}
