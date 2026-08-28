import React from 'react'
import { Eye } from 'lucide-react'
import type { Display } from '@/@types/display'
import type { Snapshot } from '@/@types/snapshot'
import type { WheelSize } from '@/@types/wheel'
import { GaugeRow } from '@/components/gauge-row'
import { Panel } from '@/components/layout/panel'
import { PanelHeader } from '@/components/layout/panel-header'
import { Button } from '@/components/ui/button'
import { strings } from '@/constants/strings'
import { DEMO_FEWEST, DEMO_USUAL } from '@/constants/wheel'
import { useDraft } from '@/hooks/use-draft'
import { previewWheel, setWheelDiameter } from '@/lib/multifus'
import { WheelDrawing } from '@/screens/wheel/wheel-drawing'

type SizePanelProps = Readonly<{
  size: WheelSize
  screen: Display | null
  run: (action: Promise<Snapshot>) => void
}>

export const SizePanel = ({ size, screen, run }: SizePanelProps) => {
  const { draft, setDraft } = useDraft(size.diameter)
  const [crowd, setCrowd] = React.useState(DEMO_USUAL)
  const words = strings.wheel

  return (
    <Panel>
      <PanelHeader
        title={words.previewTitle}
        description={words.previewDescription}
      >
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            run(previewWheel(crowd))
          }}
        >
          <Eye aria-hidden />
          {words.tryIt}
        </Button>
      </PanelHeader>
      <div className="flex flex-col gap-4 px-4 py-4">
        <WheelDrawing
          screen={screen}
          size={{ ...size, diameter: draft }}
          crowd={crowd}
        />
        <div className="mx-auto flex w-full max-w-blurb flex-col gap-2.5">
          <GaugeRow
            label={words.sizeLabel}
            reading={words.sizeValue(draft)}
            current={draft}
            min={size.smallest}
            max={size.widest}
            step={size.step}
            onChange={setDraft}
            onCommit={(diameter) => {
              run(setWheelDiameter(diameter))
            }}
          />
          <GaugeRow
            label={words.crowdLabel}
            reading={words.crowdValue(crowd)}
            current={crowd}
            min={DEMO_FEWEST}
            max={size.demo.length}
            step={1}
            onChange={setCrowd}
            onCommit={setCrowd}
          />
        </div>
      </div>
    </Panel>
  )
}
