type PanelHeaderProps = Readonly<{
  title: string
  description: string
}>

export const PanelHeader = ({ title, description }: PanelHeaderProps) => {
  return (
    <div className="flex flex-col gap-1 border-b border-border/70 px-4 py-3.5">
      <h2 className="text-row font-medium">{title}</h2>
      <p className="max-w-prose text-note text-muted-foreground">
        {description}
      </p>
    </div>
  )
}
