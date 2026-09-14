import { createFileRoute } from '@tanstack/react-router'
import { LOST_PROMISE, LOST_TITLE } from '@/components/lost-word'
import { everyTongue, titleOf } from '@/helpers/head'
import { LostTonguesScreen } from '@/screens/lost-tongues-screen'

export const Route = createFileRoute('/404')({
  head: () => {
    return {
      meta: [
        { title: titleOf(everyTongue(LOST_TITLE)) },
        { name: 'description', content: everyTongue(LOST_PROMISE) },
        { name: 'robots', content: 'noindex' }
      ]
    }
  },
  component: LostTonguesScreen
})
