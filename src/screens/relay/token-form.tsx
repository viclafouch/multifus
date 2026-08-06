import React from 'react'
import { Link2 } from 'lucide-react'
import type { PairingProblem, RelayStatus } from '@/@types/relay'
import type { Snapshot } from '@/@types/snapshot'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { strings } from '@/constants/strings'
import { pairRelay } from '@/lib/multifus'

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

type TokenFormProps = Readonly<{
  relay: RelayStatus
  run: (action: Promise<Snapshot>) => void
}>

/** The field and the button, under the steps that explain what goes in it. */
export const TokenForm = ({ relay, run }: TokenFormProps) => {
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
