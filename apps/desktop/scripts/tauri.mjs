import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'

export const runCommand = promisify(execFile)

export const TAURI_DIR = path.join(import.meta.dirname, '..', 'src-tauri')

export const CONFIG_FILE = path.join(TAURI_DIR, 'tauri.conf.json')

export const readConfig = async () => {
  return JSON.parse(await readFile(CONFIG_FILE, 'utf8'))
}
