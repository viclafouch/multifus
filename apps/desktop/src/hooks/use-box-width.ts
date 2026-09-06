import React from 'react'
import { ignore } from '@/lib/utils'

export const useBoxWidth = () => {
  const box = React.useRef<HTMLDivElement>(null)
  const [width, setWidth] = React.useState(0)

  React.useEffect(() => {
    const element = box.current

    if (element === null) {
      return ignore
    }

    const watcher = new ResizeObserver(() => {
      setWidth(element.clientWidth)
    })

    watcher.observe(element)

    return () => {
      watcher.disconnect()
    }
  }, [])

  return { box, width }
}
