import { QuietBoundary } from '@/components/quiet-boundary'
import { WheelWindow } from '@/screens/wheel-window'
import { mount } from './boot'
import './wheel.css'

mount(
  'wheel.html',
  <QuietBoundary>
    <WheelWindow />
  </QuietBoundary>
)
