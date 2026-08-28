export const afterPaint = (work: () => void) => {
  let frame = requestAnimationFrame(() => {
    frame = requestAnimationFrame(() => {
      work()
    })
  })

  return () => {
    cancelAnimationFrame(frame)
  }
}
