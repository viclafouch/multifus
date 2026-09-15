import { useLingui } from '@lingui/react'
import type { Tint } from '@multifus/retro'
import { cn } from '@multifus/retro'
import type { Icon } from '@phosphor-icons/react'
import { CheckIcon } from '@phosphor-icons/react/dist/ssr/Check'
import { XIcon } from '@phosphor-icons/react/dist/ssr/X'
import type { Rule, RuleTone } from '@/@types/body'

const RULE_TINTS = {
  kept: null,
  banned: 'tint-red'
} as const satisfies Record<RuleTone, Tint | null>

const RULE_MARKS = {
  kept: CheckIcon,
  banned: XIcon
} as const satisfies Record<RuleTone, Icon>

type RuleCardProps = Readonly<{
  rule: Rule
}>

export const RuleCard = ({ rule }: RuleCardProps) => {
  const { i18n } = useLingui()
  const { tone, icon: RuleIcon, title, lines, verdict } = rule
  const MarkIcon = RULE_MARKS[tone]

  return (
    <li
      className={cn(
        'boon torch flex flex-col gap-5 p-6 sm:p-7',
        RULE_TINTS[tone]
      )}
    >
      <span className="rosette">
        <RuleIcon weight="duotone" aria-hidden />
      </span>
      <h3 className="nameplate">{i18n._(title)}</h3>
      <ul className="flex flex-1 flex-col gap-3">
        {lines.map((line) => {
          return (
            <li
              key={i18n._(line)}
              className="flex items-start gap-3 text-tale text-band"
            >
              <MarkIcon
                weight="bold"
                aria-hidden
                className="mt-1.5 size-4 shrink-0 text-[var(--tint)]"
              />
              {i18n._(line)}
            </li>
          )
        })}
      </ul>
      <p className="rule border-t pt-4 text-tale text-cream">
        {i18n._(verdict)}
      </p>
    </li>
  )
}
