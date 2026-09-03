import React from 'react'
import { Link2 } from 'lucide-react'
import { t } from '@lingui/core/macro'
import type { RelayStatus } from '@/@types/relay'
import type { Snapshot } from '@/@types/snapshot'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { pairingProblemLine } from '@/helpers/wording'
import { pairRelay } from '@/lib/multifus'

type TokenFormProps = Readonly<{
  relay: RelayStatus
  run: (action: Promise<Snapshot>) => void
}>

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
        {t`Code du robot`}
      </label>
      <div className="flex items-start gap-2">
        <Input
          id="relay-token"
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={token}
          placeholder={t`Collez ici le code donné par BotFather`}
          aria-invalid={problem !== null}
          aria-describedby={problem === null ? undefined : 'relay-problem'}
          onChange={(event) => {
            setToken(event.target.value)
          }}
          className="font-mono text-note"
        />
        <Button type="submit" size="sm" aria-busy={isWorking}>
          <Link2 aria-hidden />
          {isWorking ? t`Connexion…` : t`Connecter`}
        </Button>
      </div>
      {problem === null ? null : (
        <p
          id="relay-problem"
          role="alert"
          className="max-w-prose text-note text-destructive"
        >
          {pairingProblemLine(problem)}
        </p>
      )}
    </form>
  )
}
