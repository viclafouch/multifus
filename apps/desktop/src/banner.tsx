import { QuietBoundary } from '@/components/quiet-boundary'
import { Banner } from '@/screens/banner-screen'
import { mount } from './boot'
import './banner.css'

mount(
  'banner.html',
  <QuietBoundary>
    <Banner />
  </QuietBoundary>
)
