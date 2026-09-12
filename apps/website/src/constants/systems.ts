import type { MessageDescriptor } from '@lingui/core'
import { msg } from '@lingui/core/macro'
import type { SystemId } from '@/@types/system'

export const SYSTEM_IDS = [
  'macos',
  'windows'
] as const satisfies readonly SystemId[]

export const SOURCE_SYSTEM = 'macos' satisfies SystemId

export const SYSTEM_OTHERS = {
  macos: 'windows',
  windows: 'macos'
} as const satisfies Record<SystemId, SystemId>

export const SYSTEM_NAMES = {
  macos: 'Mac',
  windows: 'Windows'
} as const satisfies Record<SystemId, string>

export const SYSTEM_VERSIONS = {
  macos: 'macOS 12.4',
  windows: 'Windows 10'
} as const satisfies Record<SystemId, string>

export const SYSTEM_PACKAGES = {
  macos: msg`Télécharger le .dmg`,
  windows: msg`Télécharger le .exe`
} as const satisfies Record<SystemId, MessageDescriptor>

export const SYSTEM_FLOORS = {
  macos: msg`${SYSTEM_VERSIONS.macos} Monterey ou plus récent, sur un Mac Apple Silicon`,
  windows: msg`${SYSTEM_VERSIONS.windows}, mise à jour 1709 d’octobre 2017`
} as const satisfies Record<SystemId, MessageDescriptor>

export const SYSTEM_ELSEWHERE = {
  macos: msg`Sur Mac ? Prendre le .dmg`,
  windows: msg`Sur Windows ? Prendre le .exe`
} as const satisfies Record<SystemId, MessageDescriptor>

export const SYSTEM_MOVES = {
  macos: [
    msg`Ouvrez le .dmg que vous venez de prendre.`,
    msg`Glissez Multifus dans vos Applications.`,
    msg`Lancez Multifus, et jouez.`
  ],
  windows: [
    msg`Lancez l’installeur .exe que vous venez de prendre.`,
    msg`Suivez l’installation jusqu’au bout.`,
    msg`Ouvrez Multifus, et jouez.`
  ]
} as const satisfies Record<SystemId, readonly MessageDescriptor[]>
