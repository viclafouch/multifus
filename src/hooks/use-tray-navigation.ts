import React from 'react'
import type { ScreenName } from '@/@types/snapshot'
import { onNavigate } from '@/lib/multifus'

/**
 * The screen the system tray asks the window to show.
 *
 * The menu offers the five screens directly, since opening the window is never
 * what one wants: getting to one of its screens is. This is the only thing that
 * moves the window's screen from outside a click on the rail.
 *
 * `show` sits in the dependencies rather than behind a ref: the caller hands
 * over a state setter, whose identity React guarantees, so the subscription is
 * made once and taken down with the window.
 *
 * `listen` resolves after the event bridge has answered, so the cleanup waits on
 * that promise rather than on the effect returning.
 */
export const useTrayNavigation = (show: (screen: ScreenName) => void) => {
  React.useEffect(() => {
    const subscription = onNavigate(show)

    return () => {
      subscription
        .then((unlisten) => {
          unlisten()

          return null
        })
        .catch(ignoreTeardownFailure)
    }
  }, [show])
}

/** A bridge that is already gone has nothing left to unsubscribe from. */
const ignoreTeardownFailure = () => {}
