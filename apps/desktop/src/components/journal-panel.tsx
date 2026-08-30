import React from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { JournalEntry } from '@/@types/journal'
import type { QuickReply } from '@/@types/shortcuts'
import type { Snapshot } from '@/@types/snapshot'
import { CopyButton } from '@/components/copy-button'
import { RevealButton } from '@/components/reveal-button'
import { Button } from '@/components/ui/button'
import { strings } from '@/constants/strings'
import {
  journalLine,
  journalTime,
  journalTone,
  journalTranscript
} from '@/helpers/journal'
import { revealJournal } from '@/lib/multifus'

const FOLLOW_MARGIN = 28

type JournalPanelProps = Readonly<{
  snapshot: Snapshot
}>

export const JournalPanel = ({ snapshot }: JournalPanelProps) => {
  const entries = snapshot.journal
  const lineCount = entries.length
  const [isOpen, setIsOpen] = React.useState(false)
  const list = React.useRef<HTMLOListElement>(null)
  const isFollowing = React.useRef(true)

  React.useEffect(() => {
    const element = list.current

    if (
      !isOpen ||
      lineCount === 0 ||
      element === null ||
      !isFollowing.current
    ) {
      return
    }

    element.scrollTop = element.scrollHeight
  }, [isOpen, lineCount])

  const handleScroll = (event: React.UIEvent<HTMLOListElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget

    isFollowing.current =
      scrollHeight - scrollTop - clientHeight < FOLLOW_MARGIN
  }

  const handleToggle = () => {
    isFollowing.current = true
    setIsOpen((current) => {
      return !current
    })
  }

  return (
    <section className="relative shrink-0 border-t border-border bg-sidebar">
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
        <RevealButton label={strings.journal.reveal} onReveal={revealJournal} />
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
              return (
                <JournalLine
                  key={entry.id}
                  entry={entry}
                  quickReplies={snapshot.quickReplies}
                />
              )
            })
          )}
        </ol>
      ) : null}
    </section>
  )
}

type JournalLineProps = Readonly<{
  entry: JournalEntry
  quickReplies: readonly QuickReply[]
}>

const JournalLine = ({ entry, quickReplies }: JournalLineProps) => {
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
        {journalLine(entry.event, quickReplies)}
      </span>
    </li>
  )
}
