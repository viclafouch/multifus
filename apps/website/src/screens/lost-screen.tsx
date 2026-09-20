import { Band } from '@/components/band'
import { LostWord } from '@/components/lost-word'
import { SiteShell } from '@/components/site-shell'
import { useLanguage } from '@/hooks/use-language'

export const LostScreen = () => {
  const language = useLanguage()

  return (
    <SiteShell page="home">
      <Band className="pt-rest-sm pb-rest-lg">
        <LostWord language={language} level={1} />
      </Band>
    </SiteShell>
  )
}
