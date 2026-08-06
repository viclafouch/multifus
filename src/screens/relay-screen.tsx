import React from 'react'
import {
  ExternalLink,
  Link2,
  Link2Off,
  MessageSquareText,
  TriangleAlert
} from 'lucide-react'
import type { PairingProblem, RelayLink, RelayStatus } from '@/@types/relay'
import type { Character } from '@/@types/roster'
import type { Snapshot } from '@/@types/snapshot'
import {
  FieldRow,
  Note,
  Panel,
  PanelHeader,
  Screen,
  SectionRow
} from '@/components/screen'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { strings } from '@/constants/strings'
import { screenSaverDelay } from '@/helpers/format'
import {
  openRelayLink,
  pairRelay,
  setRelayed,
  setSendBody,
  unpairRelay
} from '@/lib/multifus'

/** Why a pairing did not go through, put into words. */
const problemLine = (problem: PairingProblem) => {
  const { problem: lines } = strings.relay

  switch (problem.kind) {
    case 'tokenBlank': {
      return lines.tokenBlank
    }
    case 'tokenRefused': {
      return lines.tokenRefused(problem.detail)
    }
    case 'noChat': {
      return lines.noChat
    }
    case 'keychain': {
      return lines.keychain(problem.detail)
    }
    case 'network': {
      return lines.network(problem.detail)
    }
    default: {
      return lines.tokenBlank
    }
  }
}

/** The Rust side journals what the system refused to open. Nothing to add. */
const ignoreOpenFailure = () => {}

type LinkButtonProps = Readonly<{
  link: RelayLink
  label: string
}>

/**
 * A page multifus offers to open, named and never addressed.
 *
 * The URL lives on the Rust side, `app::relay::links`. What crosses the bridge
 * is one of three words, so nothing here can point the browser elsewhere.
 */
const LinkButton = ({ link, label }: LinkButtonProps) => {
  return (
    <Button
      variant="ghost"
      size="xs"
      onClick={() => {
        openRelayLink(link).catch(ignoreOpenFailure)
      }}
      className="text-muted-foreground hover:text-primary"
    >
      <ExternalLink aria-hidden />
      {label}
    </Button>
  )
}

type StepProps = Readonly<{
  rank: number
  title: string
  body: string
  /** The page the step opens, for the two that open one. */
  link?: RelayLink
  action?: string
}>

/**
 * One step of the setup: its rank, what to do, and why when the why surprises.
 *
 * The rank is set the way the roster sets a cycle rank, in the mono face and
 * zero-padded. That idiom already means « the nth of an ordered list » in this
 * window, and a numbered bubble invented here would have meant the same thing in
 * a second dialect.
 *
 * No rule between the steps. A divider every line turned a list of five short
 * instructions into a table, and a table is read column by column.
 */
const Step = ({ rank, title, body, link, action }: StepProps) => {
  return (
    <li className="flex items-center gap-3.5 px-4 py-2">
      <span
        aria-hidden
        className="w-5 shrink-0 pt-px text-right font-mono text-log tabular-nums text-muted-foreground/45"
      >
        {String(rank).padStart(2, '0')}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 pb-0.5">
        <p className="text-row font-medium">{title}</p>
        <p className="max-w-prose text-note text-muted-foreground">{body}</p>
      </div>
      {link === undefined || action === undefined ? null : (
        <LinkButton link={link} label={action} />
      )}
    </li>
  )
}

type TokenFormProps = Readonly<{
  relay: RelayStatus
  run: (action: Promise<Snapshot>) => void
}>

/** The field and the button, under the steps that explain what goes in it. */
const TokenForm = ({ relay, run }: TokenFormProps) => {
  const [token, setToken] = React.useState('')
  const isWorking = relay.pairing.kind === 'working'
  const problem = relay.pairing.kind === 'failed' ? relay.pairing.problem : null

  return (
    <form
      className="flex flex-col gap-2 border-t border-border/70 bg-background/25 px-4 py-3.5"
      onSubmit={(event) => {
        event.preventDefault()
        run(pairRelay(token))
      }}
    >
      <label
        htmlFor="relay-token"
        className="text-micro font-medium tracking-micro text-muted-foreground uppercase"
      >
        {strings.relay.tokenLabel}
      </label>
      <div className="flex items-start gap-2">
        <Input
          id="relay-token"
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={token}
          placeholder={strings.relay.tokenPlaceholder}
          aria-invalid={problem !== null}
          aria-describedby={problem === null ? undefined : 'relay-problem'}
          onChange={(event) => {
            setToken(event.target.value)
          }}
          className="font-mono text-note"
        />
        <Button type="submit" size="sm" aria-busy={isWorking}>
          <Link2 aria-hidden />
          {isWorking ? strings.relay.connecting : strings.relay.connect}
        </Button>
      </div>
      {problem === null ? null : (
        <p
          id="relay-problem"
          role="alert"
          className="max-w-prose text-note text-destructive"
        >
          {problemLine(problem)}
        </p>
      )}
    </form>
  )
}

type PairingGuideProps = Readonly<{
  relay: RelayStatus
  run: (action: Promise<Snapshot>) => void
}>

/**
 * The whole setup, in the order it is done, for somebody who has never opened
 * Telegram.
 *
 * Five numbered steps rather than one paragraph, because this is the only screen
 * of multifus that asks the user to go and do something in another application
 * and come back. Two of the five say *why* and not only what: a robot cannot
 * write first, which is the step everybody misses, and BotFather answers in
 * English, which otherwise reads like a wrong turn.
 */
const PairingGuide = ({ relay, run }: PairingGuideProps) => {
  const { steps } = strings.relay

  return (
    <Panel className="mb-3">
      <PanelHeader
        title={strings.relay.guideTitle}
        description={strings.relay.guideIntro}
      />
      <ol className="flex flex-col py-2">
        <Step
          rank={1}
          title={steps.web.title}
          body={steps.web.body}
          link="web"
          action={steps.web.action}
        />
        <Step
          rank={2}
          title={steps.create.title}
          body={steps.create.body}
          link="botFather"
          action={steps.create.action}
        />
        <Step rank={3} title={steps.paste.title} body={steps.paste.body} />
        <Step rank={4} title={steps.write.title} body={steps.write.body} />
        <Step rank={5} title={steps.connect.title} body={steps.connect.body} />
      </ol>
      <TokenForm relay={relay} run={run} />
    </Panel>
  )
}

type PairedPanelProps = Readonly<{
  isWorking: boolean
  run: (action: Promise<Snapshot>) => void
}>

/**
 * What is left once the pairing has gone through: a state and one button.
 *
 * No field, and that is not tidiness. The token lives in the keychain and
 * multifus never reads it back out, so there is nothing to put in one. See
 * ADR 0009.
 */
const PairedPanel = ({ isWorking, run }: PairedPanelProps) => {
  return (
    <Panel className="mb-3">
      <SectionRow
        title={strings.relay.pairedTitle}
        description={strings.relay.pairedBody}
      >
        <Button
          variant="secondary"
          size="sm"
          aria-busy={isWorking}
          onClick={() => {
            run(unpairRelay())
          }}
        >
          <Link2Off aria-hidden />
          {isWorking ? strings.relay.unpairing : strings.relay.unpair}
        </Button>
      </SectionRow>
    </Panel>
  )
}

type RelayedListProps = Readonly<{
  characters: readonly Character[]
  run: (action: Promise<Snapshot>) => void
}>

/**
 * One line per character, one tick each.
 *
 * This is the whole of what ADR 0011 reopened: a column of ticks, not the grid
 * of seven icons per character that perimetre.md turned down. An offline
 * character is ticked like any other, since one sets this up before leaving and
 * not while every client happens to be open.
 */
const RelayedList = ({ characters, run }: RelayedListProps) => {
  return (
    <ul className="flex flex-col">
      {characters.map((character) => {
        return (
          <li
            key={character.nickname}
            data-offline={character.online ? undefined : ''}
            className="flex items-center gap-4 border-b border-border/70 px-4 py-3 last:border-b-0 data-offline:dimmed"
          >
            <p className="selectable min-w-0 flex-1 truncate text-row font-medium">
              {character.nickname}
            </p>
            <Switch
              checked={character.relayed}
              aria-label={strings.relay.characterToggle(character.nickname)}
              onCheckedChange={(relayed) => {
                run(setRelayed(character.nickname, relayed))
              }}
            />
          </li>
        )
      })}
    </ul>
  )
}

type ScreenSaverWarningProps = Readonly<{
  seconds: number
}>

/**
 * The one hole the hold on the display does not close: a screen saver locks the
 * session, and a locked session draws no banner for the relay to read.
 */
const ScreenSaverWarning = ({ seconds }: ScreenSaverWarningProps) => {
  return (
    <Panel className="mb-3">
      <div className="flex items-start gap-3 px-4 py-3.5">
        <TriangleAlert
          aria-hidden
          className="mt-0.5 size-4 shrink-0 text-destructive"
          strokeWidth={1.9}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 className="text-row font-medium">
            {strings.relay.screenSaverTitle}
          </h2>
          <p className="max-w-prose text-note text-muted-foreground">
            {strings.relay.screenSaverBody(screenSaverDelay(seconds))}
          </p>
        </div>
      </div>
    </Panel>
  )
}

type RelayScreenProps = Readonly<{
  relay: RelayStatus
  characters: readonly Character[]
  run: (action: Promise<Snapshot>) => void
}>

/**
 * Where the relay is set up, and the only screen one has to open for it to work.
 *
 * This is the one feature that cannot be installed without the window, since a
 * token has to be pasted somewhere. The arbitration is the same as for the start
 * with the session: it is set once, and the daily use is one click in the system
 * tray. The principle of the project aims at settings one visits, not at the
 * ones one puts down.
 *
 * The panels come in the order the work is done: the robot first, since nothing
 * below it can do anything without one; then who is relayed; then how much of a
 * message goes out.
 */
export const RelayScreen = ({ relay, characters, run }: RelayScreenProps) => {
  return (
    <Screen title={strings.relay.title} subtitle={strings.relay.subtitle}>
      {relay.paired ? (
        <PairedPanel isWorking={relay.pairing.kind === 'working'} run={run} />
      ) : (
        <PairingGuide relay={relay} run={run} />
      )}
      {relay.screenSaver.kind === 'after' ? (
        <ScreenSaverWarning seconds={relay.screenSaver.seconds} />
      ) : null}
      <Panel className="mb-3">
        <PanelHeader
          title={strings.relay.charactersTitle}
          description={strings.relay.charactersBody}
        />
        {characters.length === 0 ? (
          <p className="px-4 py-3.5 text-note text-muted-foreground">
            {strings.relay.emptyBody}
          </p>
        ) : (
          <RelayedList characters={characters} run={run} />
        )}
      </Panel>
      <Panel>
        <FieldRow
          label={strings.relay.bodyLabel}
          description={strings.relay.bodyDescription}
          icon={
            <MessageSquareText
              className="size-glyph"
              strokeWidth={1.75}
              aria-hidden
            />
          }
        >
          <Switch
            checked={relay.sendBody}
            aria-label={strings.relay.bodyLabel}
            onCheckedChange={(sendBody) => {
              run(setSendBody(sendBody))
            }}
          />
        </FieldRow>
      </Panel>
      <Note>{strings.relay.bodyNote}</Note>
      <div className="mt-3">
        <LinkButton link="faq" label={strings.relay.help} />
      </div>
    </Screen>
  )
}
