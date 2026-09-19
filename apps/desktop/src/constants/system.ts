import { platform, version } from '@tauri-apps/plugin-os'

const FIRST_WINDOWS_ELEVEN_BUILD = 22_000

const windowsBuild = () => {
  const [, , build] = version().split('.')

  return Number(build)
}

export const IS_WINDOWS_ELEVEN =
  platform() === 'windows' && windowsBuild() >= FIRST_WINDOWS_ELEVEN_BUILD
