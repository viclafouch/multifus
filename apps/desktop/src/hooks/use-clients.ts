import React from 'react'
import type { Clients } from '@/@types/snapshot'
import { clients, onClients, watchClients } from '@/lib/multifus'
import { ignore } from '@/lib/utils'

export const useClients = () => {
  const [counted, setCounted] = React.useState<Clients | null>(null)

  React.useEffect(() => {
    let isLive = true

    const remember = (found: Clients) => {
      if (isLive) {
        setCounted(found)
      }
    }

    const opened = (async () => {
      const stop = await onClients(remember)

      await watchClients(true)

      remember(await clients())

      return stop
    })()

    opened.catch(ignore)

    return () => {
      isLive = false

      opened
        .then((stop) => {
          stop()
        }, ignore)
        .finally(() => {
          watchClients(false).catch(ignore)
        })
        .catch(ignore)
    }
  }, [])

  return counted
}
