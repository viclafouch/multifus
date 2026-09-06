import { Tale } from '@/components/layout/tale'

type MapHeaderProps = Readonly<{
  title: string
  subtitle?: string
}>

export const MapHeader = ({ title, subtitle }: MapHeaderProps) => {
  return (
    <>
      <h1 className="limelight self-center text-center font-carve text-sign tracking-wide text-balance text-cream uppercase">
        {title}
      </h1>
      <span aria-hidden className="crest self-center" />
      {subtitle === undefined ? null : <Tale>{subtitle}</Tale>}
    </>
  )
}
