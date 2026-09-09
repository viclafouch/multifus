import React from 'react'

export const useArrival = () => {
  const title = React.useRef<HTMLHeadingElement>(null)

  React.useEffect(() => {
    title.current?.focus()
  }, [])

  return title
}
