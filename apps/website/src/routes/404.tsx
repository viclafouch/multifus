import { createFileRoute } from '@tanstack/react-router'
import { SOURCE_LANGUAGE } from '@/constants/languages'
import { titleOf } from '@/helpers/head'
import { SPEAKERS } from '@/lib/i18n'
import { LOST_PROMISE, LOST_TITLE, LostScreen } from '@/screens/lost-screen'

export const Route = createFileRoute('/404')({
  head: () => {
    const speaker = SPEAKERS[SOURCE_LANGUAGE]

    return {
      meta: [
        { title: titleOf(speaker._(LOST_TITLE)) },
        { name: 'description', content: speaker._(LOST_PROMISE) },
        { name: 'robots', content: 'noindex' }
      ]
    }
  },
  component: LostScreen
})
