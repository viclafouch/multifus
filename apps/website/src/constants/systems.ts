import type { MessageDescriptor } from '@lingui/core'
import { msg } from '@lingui/core/macro'
import type { SystemId } from '@/@types/system'

export const SYSTEM_IDS = [
  'macos',
  'windows'
] as const satisfies readonly SystemId[]

export const SOURCE_SYSTEM = 'macos' satisfies SystemId

export const SYSTEM_NAMES = {
  macos: 'Mac',
  windows: 'Windows'
} as const satisfies Record<SystemId, string>

export const SYSTEM_VERSIONS = {
  macos: 'macOS 13.3',
  windows: 'Windows 10'
} as const satisfies Record<SystemId, string>

export const SYSTEM_PACKAGES = {
  macos: msg`Télécharger pour Mac`,
  windows: msg`Télécharger pour Windows`
} as const satisfies Record<SystemId, MessageDescriptor>

export const SYSTEM_FLOORS = {
  macos: msg`${SYSTEM_VERSIONS.macos} ou plus récent, sur Mac Intel comme Apple Silicon`,
  windows: msg`${SYSTEM_VERSIONS.windows} ou plus récent`
} as const satisfies Record<SystemId, MessageDescriptor>

export const SYSTEM_MOVES = {
  macos: [
    msg`Cliquez sur le bouton vert. Le fichier arrive dans vos téléchargements.`,
    msg`Ouvrez ce fichier, puis glissez Multifus dans le dossier Applications.`,
    msg`Ouvrez Multifus. Il vous montre la suite, pas à pas.`
  ],
  windows: [
    msg`Cliquez sur le bouton vert. Le fichier arrive dans vos téléchargements.`,
    msg`Ouvrez ce fichier, puis suivez l’installation jusqu’au bout.`,
    msg`Multifus s’ouvre. Il vous montre la suite, pas à pas.`
  ]
} as const satisfies Record<SystemId, readonly MessageDescriptor[]>
