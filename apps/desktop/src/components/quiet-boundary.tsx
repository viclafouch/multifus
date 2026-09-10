import React from 'react'
import { screenStopped } from '@/lib/multifus'
import { errorMessage, ignore } from '@/lib/utils'

type QuietBoundaryProps = Readonly<{
  children: React.ReactNode
}>

type QuietBoundaryState = {
  readonly hasStopped: boolean
}

export class QuietBoundary extends React.Component<
  QuietBoundaryProps,
  QuietBoundaryState
> {
  state: QuietBoundaryState = { hasStopped: false }

  static getDerivedStateFromError(): QuietBoundaryState {
    return { hasStopped: true }
  }

  // oxlint-disable-next-line class-methods-use-this -- React n’appelle componentDidCatch que sur l’instance
  componentDidCatch(error: unknown) {
    screenStopped(errorMessage(error)).catch(ignore)
  }

  render() {
    return this.state.hasStopped ? null : this.props.children
  }
}
