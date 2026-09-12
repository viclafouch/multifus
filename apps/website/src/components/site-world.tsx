type SiteWorldProps = Readonly<{
  decor: string
}>

export const SiteWorld = ({ decor }: SiteWorldProps) => {
  return (
    <div aria-hidden className="world">
      <img src={decor} alt="" className="decor size-full object-cover" />
      <div className="gloam absolute inset-0" />
    </div>
  )
}
