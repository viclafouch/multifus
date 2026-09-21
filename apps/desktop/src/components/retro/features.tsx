import { i18n } from '@lingui/core'
import { FEATURES } from '@/constants/features'

export const FeatureRoll = () => {
  return (
    <ul className="roll grid w-full grid-cols-3 gap-x-6 gap-y-2 text-left">
      {FEATURES.map((feature) => {
        return (
          <li key={feature.name.id} className="flex gap-2.5">
            <span
              aria-hidden
              className="pip mt-1.5 size-1.5 shrink-0 rotate-45"
            />
            <div>
              <p className="font-carve text-legend tracking-wide text-cream uppercase">
                {i18n._(feature.name)}
              </p>
              <p className="text-aside text-khaki/85">{i18n._(feature.line)}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
