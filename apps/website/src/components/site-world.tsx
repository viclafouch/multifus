type SiteWorldProps = Readonly<{
  decor: string
}>

export const SiteWorld = ({ decor }: SiteWorldProps) => {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-clip"
    >
      <img src={decor} alt="" className="decor size-full object-cover" />
      <div className="veil absolute inset-0" />
      <div className="gloam absolute inset-0" />
    </div>
  )
}
