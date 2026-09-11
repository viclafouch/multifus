type SceneProps = Readonly<{
  scenes: Readonly<Record<string, string>>
  here: string
}>

export const Scene = ({ scenes, here }: SceneProps) => {
  return (
    <div aria-hidden className="grove pointer-events-none absolute inset-0">
      {Object.entries(scenes).map(([name, source]) => {
        return (
          <img
            key={name}
            src={source}
            alt=""
            data-here={name === here ? '' : undefined}
            className="drift absolute inset-0 size-full object-cover"
          />
        )
      })}
      <div className="grove-shade absolute inset-0" />
      <div className="grain absolute inset-0" />
    </div>
  )
}
