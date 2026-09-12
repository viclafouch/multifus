const HANDHELD = /android|iphone|ipad|ipod/iu

const APPLE = /mac/iu

const WINDOWS = /win/iu

export const systemOf = (agent: string) => {
  if (HANDHELD.test(agent)) {
    return null
  }

  if (APPLE.test(agent)) {
    return 'macos'
  }

  if (WINDOWS.test(agent)) {
    return 'windows'
  }

  return null
}
