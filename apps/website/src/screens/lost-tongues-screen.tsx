import { Band } from '@/components/band'
import { LostWord } from '@/components/lost-word'
import { Plate } from '@/components/plate'
import { SiteShell } from '@/components/site-shell'
import { LANGUAGES, SOURCE_LANGUAGE } from '@/constants/languages'

const OFFERED = LANGUAGES.filter((language) => {
  return language !== SOURCE_LANGUAGE
})

export const LostTonguesScreen = () => {
  return (
    <SiteShell page="home">
      <Band className="pt-12 pb-6">
        <LostWord language={SOURCE_LANGUAGE} level={1} />
      </Band>
      <Band className="grid gap-6 pt-4 pb-20 sm:grid-cols-2">
        {OFFERED.map((language) => {
          return (
            <Plate key={language}>
              <LostWord language={language} level={2} />
            </Plate>
          )
        })}
      </Band>
    </SiteShell>
  )
}
