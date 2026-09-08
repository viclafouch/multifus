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
      {subtitle === undefined ? (
        <span aria-hidden className="crest w-crest self-center" />
      ) : (
        <Tale>{subtitle}</Tale>
      )}
    </>
  )
}
