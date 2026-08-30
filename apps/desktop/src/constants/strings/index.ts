import { ABOUT_STRINGS } from '@/constants/strings/about'
import { AUTHORIZATION_STRINGS } from '@/constants/strings/authorization'
import { AUTO_FOCUS_STRINGS } from '@/constants/strings/auto-focus'
import { CHARACTERS_STRINGS } from '@/constants/strings/characters'
import { CONFIG_NOTICE_STRINGS } from '@/constants/strings/config-notice'
import { JOURNAL_PANEL_STRINGS } from '@/constants/strings/journal-panel'
import { MAXIMIZE_STRINGS } from '@/constants/strings/maximize'
import { NAV_RAIL_STRINGS } from '@/constants/strings/nav-rail'
import { QUICK_REPLIES_STRINGS } from '@/constants/strings/quick-replies'
import { RELAY_STRINGS } from '@/constants/strings/relay'
import { RUNE_TABLE_STRINGS } from '@/constants/strings/rune-table'
import { SETTINGS_STRINGS } from '@/constants/strings/settings'
import { SHORTCUTS_STRINGS } from '@/constants/strings/shortcuts'
import { WALK_STRINGS } from '@/constants/strings/walk'
import { WHEEL_STRINGS } from '@/constants/strings/wheel'

export const strings = {
  ...NAV_RAIL_STRINGS,
  ...CHARACTERS_STRINGS,
  ...AUTHORIZATION_STRINGS,
  ...SHORTCUTS_STRINGS,
  ...QUICK_REPLIES_STRINGS,
  ...AUTO_FOCUS_STRINGS,
  ...WALK_STRINGS,
  ...WHEEL_STRINGS,
  ...RUNE_TABLE_STRINGS,
  ...RELAY_STRINGS,
  ...SETTINGS_STRINGS,
  ...ABOUT_STRINGS,
  ...CONFIG_NOTICE_STRINGS,
  ...MAXIMIZE_STRINGS,
  ...JOURNAL_PANEL_STRINGS
} as const
