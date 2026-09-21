import process from 'node:process'
import { readConfig, runCommand } from './tauri.mjs'

const ACCESSIBILITY_SERVICE = 'Accessibility'

const skipReason = () => {
  if (process.platform !== 'darwin') {
    return 'Accessibility is a macOS service'
  }

  return process.env.CI === undefined
    ? null
    : 'a runner never grants Accessibility'
}

const resetAuthorization = async () => {
  const { identifier } = await readConfig()

  try {
    await runCommand('tccutil', ['reset', ACCESSIBILITY_SERVICE, identifier])

    return `Accessibility reset for ${identifier}, tick Multifus again when it asks`
  } catch (failure) {
    return `Accessibility left as it was for ${identifier}: ${failure.message.trim()}`
  }
}

const reason = skipReason()

const line =
  reason === null ? await resetAuthorization() : `Nothing to reset: ${reason}`

process.stdout.write(`${line}\n`)
