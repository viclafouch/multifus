import React from 'react'
import { onRuneTableLook, runeTableLook } from '@/lib/multifus'
import { ignore } from '@/lib/utils'

export const useRuneTableLook = () => {
  const [look, setLook] = React.useState(1)

  React.useEffect(() => {
    let isLive = true
    let hasHeardRust = false
    let stop: (() => void) | null = null

    const subscribe = async () => {
      const told = await onRuneTableLook((next) => {
        if (isLive) {
          hasHeardRust = true

          setLook(next)
        }
      })

      if (isLive) {
        stop = told
      } else {
        told()
      }

      const first = await runeTableLook()

      if (isLive && !hasHeardRust) {
        setLook(first)
      }
    }

    subscribe().catch(ignore)

    return () => {
      isLive = false

      stop?.()
    }
  }, [])

  return look
}
