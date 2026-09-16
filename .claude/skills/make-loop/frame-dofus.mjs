#!/usr/bin/env node
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const WINDOW_WIDTH = 702
const WINDOW_HEIGHT = 560
const TITLE_BAR_HEIGHT = 28
const CAPTURE_WIDTH = 700
const CAPTURE_HEIGHT = 410

const APPLESCRIPT = `tell application "System Events"
  if not (exists process "Dofus Retro") then return "absent"
  tell process "Dofus Retro"
    set report to {}
    repeat with theWindow in windows
      set size of theWindow to {${WINDOW_WIDTH}, ${WINDOW_HEIGHT}}
      set {originX, originY} to position of theWindow
      set {actualWidth, actualHeight} to size of theWindow
      set end of report to (name of theWindow) & tab & originX & tab & originY & tab & actualWidth & tab & actualHeight
    end repeat
    set AppleScript's text item delimiters to linefeed
    return report as text
  end tell
end tell`

const readWindows = async () => {
  const { stdout } = await execFileAsync('osascript', ['-e', APPLESCRIPT])
  const answer = stdout.trim()

  if (answer === 'absent') {
    return null
  }

  return answer.split('\n').map((line) => {
    const [title, originX, originY, width, height] = line.split('\t')

    return {
      title,
      originX: Number(originX),
      originY: Number(originY),
      width: Number(width),
      height: Number(height)
    }
  })
}

const windows = await readWindows()

if (windows === null) {
  console.error('Dofus Retro ne tourne pas.')
  process.exit(1)
}

for (const { title, originX, originY, width, height } of windows) {
  const isResized = width === WINDOW_WIDTH && height === WINDOW_HEIGHT
  const region = [
    originX,
    originY + TITLE_BAR_HEIGHT,
    CAPTURE_WIDTH,
    CAPTURE_HEIGHT
  ].join(',')

  console.log(
    isResized
      ? `${title}\n  fenêtre ${width} × ${height}, sélection ${region}`
      : `${title}\n  refusée à ${WINDOW_WIDTH} × ${WINDOW_HEIGHT}, reste à ${width} × ${height}`
  )
}

console.log('\nscreencapture -x -R<sélection> montre le cadre avant de filmer.')
