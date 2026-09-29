import { QuietBoundary } from '@/components/quiet-boundary'
import { CompanionWindow } from '@/screens/companion-window'
import { mount } from './boot'
import './companion.css'

mount(
  'companion.html',
  <QuietBoundary>
    <CompanionWindow />
  </QuietBoundary>
)
