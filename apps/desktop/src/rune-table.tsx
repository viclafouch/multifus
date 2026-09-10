import { QuietBoundary } from '@/components/quiet-boundary'
import { RuneTableWindow } from '@/screens/rune-table-window'
import { mount } from './boot'
import './rune-table.css'

mount(
  'rune-table.html',
  <QuietBoundary>
    <RuneTableWindow />
  </QuietBoundary>
)
