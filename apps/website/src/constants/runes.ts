import type { MessageDescriptor } from '@lingui/core'
import { msg } from '@lingui/core/macro'
import type { RuneFamilyId, RuneStatId } from '@multifus/runes'

export const RUNE_FAMILY_NAMES = {
  heavy: msg`Les lourdes`,
  damage: msg`Dommages`,
  resistance: msg`Résistances`,
  secondary: msg`Secondaires`,
  primary: msg`Les légères`
} as const satisfies Record<RuneFamilyId, MessageDescriptor>

export const RUNE_STAT_NAMES = {
  actionPoint: msg`PA`,
  movePoint: msg`PM`,
  range: msg`PO`,
  summon: msg`Invocation`,
  critical: msg`Critique`,
  heal: msg`Soin`,
  damageReturn: msg`Renvoi de dommages`,
  damage: msg`Dommages`,
  trapDamage: msg`Dommages piège`,
  trapPercent: msg`% piège`,
  damagePercent: msg`% dommages`,
  resistPercent: msg`% résistance`,
  resistFlat: msg`Résistance fixe`,
  wisdom: msg`Sagesse`,
  prospecting: msg`Prospection`,
  hunt: msg`Chasse`,
  elements: msg`Intelligence, Force, Agilité, Chance`,
  initiative: msg`Initiative`,
  vitality: msg`Vitalité`,
  pods: msg`Pods`
} as const satisfies Record<RuneStatId, MessageDescriptor>
