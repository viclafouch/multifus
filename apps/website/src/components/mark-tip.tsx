import ReactDOM from 'react-dom'
import type { Mark } from '@/@types/rival'
import { MarkGlyph } from '@/components/mark-glyph'
import { useTip } from '@/hooks/use-tip'

type MarkTipProps = Readonly<{
  mark: Mark
  line: string
  anchor: string
}>

export const MarkTip = ({ mark, line, anchor }: MarkTipProps) => {
  const { spot, show, hide, hold } = useTip()

  return (
    <span className="relative block">
      <button
        type="button"
        aria-describedby={anchor}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
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
              style={{ left: spot.left, top: spot.top }}
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
