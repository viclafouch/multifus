import { useLingui } from '@lingui/react'
import { Button } from '@multifus/retro'
import { PageLink } from '@/components/page-link'
import { PAGE_NAMES } from '@/constants/wording'

export const DownloadButton = () => {
  const { i18n } = useLingui()

  return (
    <Button
      variant="leaf"
      size="lead"
      nativeButton={false}
      className="self-start"
      render={<PageLink page="download" isBare className="sighted" />}
    >
      {i18n._(PAGE_NAMES.download)}
    </Button>
  )
}
