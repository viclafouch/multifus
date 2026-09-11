export const ignore = () => {}

export const errorMessage = (error: unknown) => {
  const carriesMessage =
    typeof error === 'object' && error !== null && 'message' in error

  return carriesMessage ? String(error.message) : String(error)
}
