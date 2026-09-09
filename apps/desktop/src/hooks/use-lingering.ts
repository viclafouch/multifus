import React from 'react'
import { useStill } from '@/hooks/use-still'
import { ignore } from '@/lib/utils'

type LingeringParams<Item> = {
  items: readonly Item[]
  keyOf: (item: Item) => string
  wait: number
}

type BlendParams<Item> = {
  shown: readonly Item[]
  items: readonly Item[]
  keyOf: (item: Item) => string
}

const blend = <Item>({ shown, items, keyOf }: BlendParams<Item>) => {
  const live = new Set(items.map(keyOf))

  return shown.reduce<readonly Item[]>((list, item, index) => {
    if (live.has(keyOf(item))) {
      return list
    }

    return [...list.slice(0, index), item, ...list.slice(index)]
  }, items)
}

export const useLingering = <Item>({
  items,
  keyOf,
  wait
}: LingeringParams<Item>) => {
  const isStill = useStill()
  const [source, setSource] = React.useState(items)
  const [shown, setShown] = React.useState(items)

  if (source !== items) {
    setSource(items)
    setShown(blend({ shown, items, keyOf }))
  }

  React.useEffect(() => {
    if (shown.length === items.length) {
      return ignore
    }

    const timer = setTimeout(() => {
      setShown(items)
    }, wait)

    return () => {
      clearTimeout(timer)
    }
  }, [items, shown, wait])

  if (isStill) {
    return items.map((item) => {
      return { item, isLeaving: false }
    })
  }

  const live = new Set(items.map(keyOf))

  return shown.map((item) => {
    return { item, isLeaving: !live.has(keyOf(item)) }
  })
}
