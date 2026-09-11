type DecorBandProps = Readonly<{
  scene: string
}>

export const DecorBand = ({ scene }: DecorBandProps) => {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-clip"
    >
      <img src={scene} alt="" className="dusk size-full object-cover" />
      <div className="veil absolute inset-0" />
      <div className="hem-deep absolute inset-0" />
    </div>
  )
}
