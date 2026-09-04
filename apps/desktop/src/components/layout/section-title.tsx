type SectionTitleProps = Readonly<{
  title: string
  subtitle: string
}>

export const SectionTitle = ({ title, subtitle }: SectionTitleProps) => {
  return (
    <div className="flex flex-col gap-1 pt-7 pb-3">
      <h2 className="font-display text-heading font-semibold tracking-title">
        {title}
      </h2>
      <p className="max-w-prose text-body text-muted-foreground">{subtitle}</p>
    </div>
  )
}
