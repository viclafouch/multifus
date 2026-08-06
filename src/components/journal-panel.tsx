import React from 'react'
import { ChevronDown, ChevronUp, FolderOpen } from 'lucide-react'
import type { JournalEntry } from '@/@types/journal'
import type { Snapshot } from '@/@types/snapshot'
import { CopyButton } from '@/components/copy-button'
import { Button } from '@/components/ui/button'
import { strings } from '@/constants/strings'
import {
  journalLine,
  journalTime,
  journalTone,
  journalTranscript
} from '@/helpers/journal'
import { revealJournal } from '@/lib/multifus'

/**
 * How far from the foot of the journal still counts as being at the foot, in
 * pixels. A line and a half, so that a fractional scroll position or a resize
 * does not read as somebody having deliberately scrolled up.
 */
const FOLLOW_MARGIN = 28

type JournalPanelProps = Readonly<{
  snapshot: Snapshot
}>

/**
 * The drawer at the foot of the window, shut by default.
 *
 * It exists for one day: the one where a notification arrives and nothing comes
 * to the front. Every step multifus goes through is written here, so the answer
 * is a scroll away instead of a rebuild with a print statement in it.
 *
 * It draws what the Rust side holds in memory and not the whole journal, which
 * lives in a file and goes weeks further back. Two buttons for that reason: the
 * clipboard hands over these lines with everything needed to read them, and the
 * other one opens the file.
 *
 * It takes the whole snapshot rather than the entries alone, because the copy is
 * only worth something with the version, the system, the authorization and the
 * four combinations in front of it.
 */
export const JournalPanel = ({ snapshot }: JournalPanelProps) => {
  const entries = snapshot.journal
  const [isOpen, setIsOpen] = React.useState(false)
  const list = React.useRef<HTMLOListElement>(null)
  // Whether the reader is still at the foot of the journal. Kept in a ref
  // because nothing on screen depends on it, so changing it must not re-render.
  const isFollowing = React.useRef(true)

  // Scrolling a node the browser owns is what an effect is for. It only pins to
  // the bottom while the reader is already there: the day this journal earns its
  // keep, somebody is scrolled up reading the lines that led to the failure, and
  // a scan writing a new line every three seconds must not yank them back down.
  React.useEffect(() => {
    const element = list.current

    if (element === null || !isFollowing.current) {
      return
    }

    element.scrollTop = element.scrollHeight
  }, [entries, isOpen])

  const handleScroll = (event: React.UIEvent<HTMLOListElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget

    isFollowing.current =
      scrollHeight - scrollTop - clientHeight < FOLLOW_MARGIN
  }

  const handleToggle = () => {
    // Opening the drawer always lands on the newest line, whatever the reader
    // had scrolled to before shutting it.
    isFollowing.current = true
    setIsOpen((current) => {
      return !current
    })
  }

  const handleReveal = () => {
    revealJournal().catch(ignoreRevealFailure)
  }

  return (
    <section className="shrink-0 border-t border-border bg-sidebar/80">
      <div className="flex items-center pr-2.5">
        <h2 className="min-w-0 flex-1">
          <Button
            variant="ghost"
            aria-expanded={isOpen}
            onClick={handleToggle}
            title={isOpen ? strings.journal.hide : strings.journal.show}
            className="h-9 w-full justify-start gap-2 rounded-none px-4 text-mini tracking-micro text-muted-foreground uppercase"
          >
            {isOpen ? (
              <ChevronDown strokeWidth={2} />
            ) : (
              <ChevronUp strokeWidth={2} />
            )}
            {strings.journal.title}
            <span className="ml-auto font-mono text-micro tracking-normal normal-case">
              {strings.journal.entries(entries.length)}
            </span>
          </Button>
        </h2>
        {entries.length === 0 ? null : (
          <CopyButton
            text={journalTranscript(snapshot)}
            label={strings.journal.copy}
            copiedLabel={strings.journal.copied}
          />
        )}
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleReveal}
          title={strings.journal.reveal}
          aria-label={strings.journal.reveal}
          className="text-muted-foreground/55 hover:text-foreground"
        >
          <FolderOpen aria-hidden strokeWidth={2} />
        </Button>
      </div>
      {isOpen ? (
        <ol
          ref={list}
          onScroll={handleScroll}
          className="h-journal overflow-y-auto border-t border-border/70 px-4 py-2.5 font-mono text-log"
        >
          {entries.length === 0 ? (
            <li className="text-muted-foreground/70">
              {strings.journal.empty}
            </li>
          ) : (
            entries.map((entry) => {
              return <JournalLine key={entry.id} entry={entry} />
            })
          )}
        </ol>
      ) : null}
    </section>
  )
}

type JournalLineProps = Readonly<{
  entry: JournalEntry
}>

/** The Rust side journals what the system refused to open. Nothing to add. */
const ignoreRevealFailure = () => {}

const JournalLine = ({ entry }: JournalLineProps) => {
  return (
    <li
      data-tone={journalTone(entry.event)}
      className="group/line flex gap-2.5"
    >
      <span
        aria-hidden
        className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/40 group-data-[tone=good]/line:bg-primary/80 group-data-[tone=warning]/line:bg-destructive/85"
      />
      <time className="shrink-0 text-muted-foreground/55 tabular-nums">
        {journalTime(entry.at)}
      </time>
      <span className="selectable min-w-0 break-words text-muted-foreground group-data-[tone=warning]/line:text-foreground/90">
        {journalLine(entry.event)}
      </span>
    </li>
  )
}
