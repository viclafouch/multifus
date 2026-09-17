import { useLingui } from '@lingui/react'
import { Button } from '@multifus/retro'
import { DownloadSimpleIcon } from '@phosphor-icons/react/dist/ssr/DownloadSimple'
import { PageLink } from '@/components/page-link'
import { PAGE_NAMES } from '@/constants/wording'

export const DownloadButton = () => {
  const { i18n } = useLingui()

  return (
    <Button
      variant="leaf"
      size="lead"
      nativeButton={false}
      render={<PageLink page="download" isBare className="sighted" />}
    >
      <DownloadSimpleIcon weight="bold" aria-hidden />
      {i18n._(PAGE_NAMES.download)}
    </Button>
  )
}
