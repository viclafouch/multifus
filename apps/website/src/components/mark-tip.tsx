import React from 'react'
import ReactDOM from 'react-dom'
import type { Mark } from '@/@types/rival'
import { MarkGlyph } from '@/components/mark-glyph'
import { useMedia } from '@/hooks/use-media'
import { useTip } from '@/hooks/use-tip'
import { HOVER } from '@/lib/media'

type TipGeometry = React.CSSProperties & Readonly<Record<'--tip-wide', string>>

type MarkTipProps = Readonly<{
  mark: Mark
  line: string
  anchor: string
}>

export const MarkTip = ({ mark, line, anchor }: MarkTipProps) => {
  const isHovering = useMedia(HOVER)
  const { spot, show, toggle, hide, hold } = useTip()
  const handlers = isHovering
    ? { onMouseEnter: show, onMouseLeave: hide, onFocus: show, onBlur: hide }
    : { onClick: toggle }

  return (
    <span className="relative block">
      <button
        {...handlers}
        type="button"
        aria-describedby={anchor}
        className="hinted sighted mx-auto block w-marker"
      >
        <MarkGlyph mark={mark} />
      </button>
      <span id={anchor} className="sr-only">
        {line}
      </span>
      {spot === null
        ? null
        : ReactDOM.createPortal(
            <span
              role="tooltip"
              style={
                {
                  left: spot.left,
                  top: spot.top,
                  '--tip-wide': `${spot.wide}px`
                } satisfies TipGeometry
              }
              onMouseEnter={hold}
              onMouseLeave={hide}
              className="tip"
            >
              {line}
            </span>,
            document.body
          )}
    </span>
  )
}
