import { useLingui } from '@lingui/react'
import { PROVENANCE_IDS, PROVENANCES } from '@/constants/provenance'

export const ProvenanceList = () => {
  const { i18n } = useLingui()

  return (
    <dl className="glass flex flex-col">
      {PROVENANCE_IDS.map((provenance) => {
        const { name, origin } = PROVENANCES[provenance]

        return (
          <div
            key={provenance}
            className="rule grid gap-2 border-b px-4 py-5 last:border-b-0 sm:grid-cols-3 sm:gap-6 sm:px-6"
          >
            <dt className="font-carve text-bar tracking-wide text-band uppercase">
              {i18n._(name)}
            </dt>
            <dd className="text-tale text-cream sm:col-span-2">
              {i18n._(origin)}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}
