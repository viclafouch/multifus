import { Band } from '@/components/band'
import { LostWord } from '@/components/lost-word'
import { SiteShell } from '@/components/site-shell'
import { useLanguage } from '@/hooks/use-language'

export const LostScreen = () => {
  const language = useLanguage()

  return (
    <SiteShell page="home">
      <Band className="pt-12 pb-20">
        <LostWord language={language} level={1} />
      </Band>
    </SiteShell>
  )
}
