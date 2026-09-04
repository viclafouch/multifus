import React from 'react'
import { Check } from 'lucide-react'

export type ProofState = 'done' | 'listening' | 'pending'

type ProofMarkProps = Readonly<{
  state: ProofState
}>

const ProofMark = ({ state }: ProofMarkProps) => {
  switch (state) {
    case 'done': {
      return (
        <span className="flex size-mark shrink-0 items-center justify-center rounded-full bg-live/12 text-live ring-1 ring-live/40">
          <Check aria-hidden className="size-3" strokeWidth={2.6} />
        </span>
      )
    }
    case 'listening': {
      return (
        <span className="flex size-mark shrink-0 items-center justify-center">
          <span aria-hidden className="sonar size-2 rounded-full" />
        </span>
      )
    }
    case 'pending': {
      return (
        <span className="flex size-mark shrink-0 items-center justify-center">
          <span
            aria-hidden
            className="size-2 rounded-full border border-muted-foreground/35"
          />
        </span>
      )
    }
    default: {
      return state satisfies never
    }
  }
}

type ProofLineProps = Readonly<{
  state: ProofState
  label: string
  hasTrail: boolean
  children: React.ReactNode
}>

export const ProofLine = ({
  state,
  label,
  hasTrail,
  children
}: ProofLineProps) => {
  return (
    <li className="flex w-full gap-3">
      <div className="flex flex-col items-center">
        <ProofMark state={state} />
        {hasTrail ? (
          <span
            data-lit={state === 'done' ? '' : undefined}
            className="w-px flex-1 bg-border transition-row data-lit:bg-live/40"
          />
        ) : null}
      </div>
      <div
        data-trail={hasTrail ? '' : undefined}
        className="flex flex-1 flex-col items-start gap-1.5 text-left data-trail:pb-4"
      >
        <p
          data-state={state}
          className="font-mono text-micro tracking-micro uppercase data-[state=done]:text-live data-[state=listening]:text-primary data-[state=pending]:text-muted-foreground/55"
        >
          {label}
        </p>
        {children}
      </div>
    </li>
  )
}
