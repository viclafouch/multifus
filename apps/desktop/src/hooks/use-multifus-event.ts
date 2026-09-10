import React from 'react'
import type { UnlistenFn } from '@tauri-apps/api/event'
import { ignore } from '@/lib/utils'

type Listen<Payload> = (
  handle: (payload: Payload) => void
) => Promise<UnlistenFn>

export const useMultifusEvent = <Payload>(
  listen: Listen<Payload>,
  handle: (payload: Payload) => void
) => {
  const told = React.useEffectEvent(handle)
  const subscribe = React.useEffectEvent(listen)

  React.useEffect(() => {
    const subscription = subscribe((payload) => {
      told(payload)
    })

    return () => {
      subscription
        .then((unlisten) => {
          unlisten()

          return null
        })
        .catch(ignore)
    }
  }, [])
}
