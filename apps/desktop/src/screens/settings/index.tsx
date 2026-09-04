import {
  Activity,
  Maximize2,
  Power,
  Rows3,
  SquareUserRound,
  Type
} from 'lucide-react'
import { t } from '@lingui/core/macro'
import type { Onboarding } from '@/@types/onboarding'
import type { Snapshot } from '@/@types/snapshot'
import { FieldRow } from '@/components/layout/field-row'
import { Note } from '@/components/layout/note'
import { Panel } from '@/components/layout/panel'
import { Screen } from '@/components/layout/screen'
import { Switch } from '@/components/ui/switch'
import { UnavailableSwitch } from '@/components/unavailable-switch'
import { WindowsSwitch } from '@/components/windows-switch'
import { IS_APPLE } from '@/constants/keyboard'
import { useClients } from '@/hooks/use-clients'
import {
  setMaximizeOnLaunch,
  setPaintPortraits,
  setShortTitles,
  setStartAtLogin,
  setUngroupTaskbar
} from '@/lib/multifus'
import { OnboardingSection } from '@/screens/onboarding'
import { ClientsPanel } from '@/screens/settings/clients-panel'

type SettingsScreenProps = Readonly<{
  startAtLogin: boolean
  maximizeOnLaunch: boolean
  shortTitles: boolean
  paintPortraits: boolean
  ungroupTaskbar: boolean
  taskbarCombines: boolean
  onboarding: Onboarding
  run: (action: Promise<Snapshot>) => void
}>

export const SettingsScreen = ({
  startAtLogin,
  maximizeOnLaunch,
  shortTitles,
  paintPortraits,
  ungroupTaskbar,
  taskbarCombines,
  onboarding,
  run
}: SettingsScreenProps) => {
  const startupLabel = t`Lancer Multifus au démarrage de l’ordinateur`
  const maximizeLabel = t`Agrandir les clients à leur ouverture`
  const shortTitlesLabel = t`Seulement le pseudo dans la barre des tâches`
  const portraitLabel = t`La tête de classe dans la barre des tâches`
  const ungroupLabel = t`Un bouton par personnage dans la barre des tâches`
  const backgroundLabel = t`Garder Multifus en arrière-plan`

  const isAlreadyUngrouped = !IS_APPLE && !taskbarCombines
  const clients = useClients()

  return (
    <Screen
      title={t`Paramètres`}
      subtitle={t`Ce que Multifus fait pendant que vous jouez, seul ou sur demande.`}
    >
      {IS_APPLE ? (
        <Note className="mb-4">{t`Sur Mac, Multifus tourne mieux sans plein écran : gardez tous vos clients Dofus Retro sur le même bureau, en fenêtre agrandie.`}</Note>
      ) : null}
      {clients === null ? null : <ClientsPanel clients={clients} run={run} />}
      <Panel>
        <FieldRow
          label={startupLabel}
          description={t`Multifus est déjà là quand vous ouvrez vos clients Dofus Retro.`}
          icon={<Power className="size-glyph" strokeWidth={1.75} aria-hidden />}
        >
          <Switch
            checked={startAtLogin}
            aria-label={startupLabel}
            onCheckedChange={(checked) => {
              run(setStartAtLogin(checked))
            }}
          />
        </FieldRow>
        <FieldRow
          label={maximizeLabel}
          description={
            IS_APPLE
              ? t`La fenêtre couvre l’écran, Dock et barre des menus en place.`
              : t`La fenêtre couvre l’écran, barre des tâches en place.`
          }
          icon={
            <Maximize2 className="size-glyph" strokeWidth={1.75} aria-hidden />
          }
        >
          <Switch
            checked={maximizeOnLaunch}
            aria-label={maximizeLabel}
            onCheckedChange={(checked) => {
              run(setMaximizeOnLaunch(checked))
            }}
          />
        </FieldRow>
        <FieldRow
          label={shortTitlesLabel}
          description={t`Vous lisez « Elyandra » au lieu de « Elyandra - Dofus Retro ».`}
          icon={<Type className="size-glyph" strokeWidth={1.75} aria-hidden />}
        >
          <WindowsSwitch
            checked={shortTitles}
            label={shortTitlesLabel}
            onCheckedChange={(short) => {
              run(setShortTitles(short))
            }}
          />
        </FieldRow>
        <FieldRow
          label={portraitLabel}
          description={t`Vous repérez votre Enu à sa tête, pas à son titre.`}
          icon={
            <SquareUserRound
              className="size-glyph"
              strokeWidth={1.75}
              aria-hidden
            />
          }
        >
          <WindowsSwitch
            checked={paintPortraits}
            label={portraitLabel}
            onCheckedChange={(paint) => {
              run(setPaintPortraits(paint))
            }}
          />
        </FieldRow>
        <FieldRow
          label={ungroupLabel}
          description={
            isAlreadyUngrouped
              ? t`Déjà fait : votre Windows ne colle jamais les fenêtres ensemble.`
              : t`Chaque client garde son bouton au lieu d’être empilé avec les autres.`
          }
          icon={<Rows3 className="size-glyph" strokeWidth={1.75} aria-hidden />}
        >
          <WindowsSwitch
            checked={ungroupTaskbar}
            label={ungroupLabel}
            onCheckedChange={(ungroup) => {
              run(setUngroupTaskbar(ungroup))
            }}
          />
        </FieldRow>
        <FieldRow
          label={backgroundLabel}
          description={
            IS_APPLE
              ? t`La croix ne quitte pas Multifus : son icône reste en haut à droite de l’écran.`
              : t`La croix ne quitte pas Multifus : son icône reste à côté de l’horloge.`
          }
          icon={
            <Activity className="size-glyph" strokeWidth={1.75} aria-hidden />
          }
        >
          <UnavailableSwitch
            checked
            label={backgroundLabel}
            reason={t`Multifus doit rester en arrière-plan pour fonctionner.`}
          />
        </FieldRow>
      </Panel>
      <OnboardingSection onboarding={onboarding} run={run} />
    </Screen>
  )
}
