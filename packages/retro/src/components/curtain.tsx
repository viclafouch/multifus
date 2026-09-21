import React from 'react'
import { useIdlePointer } from '../hooks/use-idle-pointer'

type CurtainProps = Readonly<{
  isPlaying: boolean
  label: string
  onToggle: () => void
  children: React.ReactNode
  caption?: React.ReactNode
}>

export const Curtain = ({
  isPlaying,
  label,
  onToggle,
  children,
  caption
}: CurtainProps) => {
  const curtain = useIdlePointer(isPlaying)

  return (
    <button
      ref={curtain}
      type="button"
      aria-label={label}
      data-playing={isPlaying ? '' : undefined}
      className="curtain"
      onClick={onToggle}
    >
      <span className="beacon">{children}</span>
      {caption}
    </button>
  )
}
