import type { MessageDescriptor } from '@lingui/core'
import { msg } from '@lingui/core/macro'
import type { SystemId } from '@/@types/system'

export const SYSTEM_IDS = [
  'macos',
  'windows'
] as const satisfies readonly SystemId[]

export const SYSTEM_VERSIONS = {
  macos: 'macOS 12.4',
  windows: 'Windows 10'
} as const satisfies Record<SystemId, string>

export const SYSTEM_PACKAGES = {
  macos: msg`Télécharger le .dmg (Apple Silicon)`,
  windows: msg`Télécharger l’installeur .exe`
} as const satisfies Record<SystemId, MessageDescriptor>

export const SYSTEM_FLOORS = {
  macos: msg`${SYSTEM_VERSIONS.macos} Monterey ou plus récent`,
  windows: msg`${SYSTEM_VERSIONS.windows}, mise à jour 1709 d’octobre 2017`
} as const satisfies Record<SystemId, MessageDescriptor>
