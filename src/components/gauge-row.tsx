import React from 'react'
import { Slider } from '@/components/ui/slider'
import { gaugeValue } from '@/helpers/gauge'

type GaugeRowProps = Readonly<{
  label: string
  reading: string
  current: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  onCommit: (value: number) => void
}>

export const GaugeRow = ({
  label,
  reading,
  current,
  min,
  max,
  step,
  onChange,
  onCommit
}: GaugeRowProps) => {
  const labelId = React.useId()

  return (
    <div className="flex items-center gap-3">
      <span
        id={labelId}
        className="w-24 shrink-0 text-micro text-muted-foreground/70"
      >
        {label}
      </span>
      <Slider
        value={[current]}
        min={min}
        max={max}
        step={step}
        aria-labelledby={labelId}
        onValueChange={(next) => {
          onChange(gaugeValue(next, current))
        }}
        onValueCommitted={(next) => {
          onCommit(gaugeValue(next, current))
        }}
      />
      <output className="w-20 shrink-0 text-right font-mono text-note tabular-nums text-foreground/85">
        {reading}
      </output>
    </div>
  )
}
