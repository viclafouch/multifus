/**
 * Every word the window shows, one fragment per surface. The system tray has
 * words of its own, in `app::tray`: an `NSMenu` is not React's to draw.
 */

import { ABOUT_STRINGS } from '@/constants/strings/about'
import { AUTHORIZATION_STRINGS } from '@/constants/strings/authorization'
import { AUTO_FOCUS_STRINGS } from '@/constants/strings/auto-focus'
import { CHARACTERS_STRINGS } from '@/constants/strings/characters'
import { CONFIG_NOTICE_STRINGS } from '@/constants/strings/config-notice'
import { JOURNAL_PANEL_STRINGS } from '@/constants/strings/journal-panel'
import { NAV_RAIL_STRINGS } from '@/constants/strings/nav-rail'
import { RELAY_STRINGS } from '@/constants/strings/relay'
import { SETTINGS_STRINGS } from '@/constants/strings/settings'
import { SHORTCUTS_STRINGS } from '@/constants/strings/shortcuts'

// Each fragment carries its own `as const`, without which it would hand back
// `string` where the callers read a literal.
export const strings = {
  ...NAV_RAIL_STRINGS,
  ...CHARACTERS_STRINGS,
  ...AUTHORIZATION_STRINGS,
  ...SHORTCUTS_STRINGS,
  ...AUTO_FOCUS_STRINGS,
  ...RELAY_STRINGS,
  ...SETTINGS_STRINGS,
  ...ABOUT_STRINGS,
  ...CONFIG_NOTICE_STRINGS,
  ...JOURNAL_PANEL_STRINGS
} as const
