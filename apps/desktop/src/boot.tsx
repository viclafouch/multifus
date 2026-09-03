import React from 'react'
import type { Root } from 'react-dom/client'
import ReactDOM from 'react-dom/client'
import { SOURCE_LANGUAGE, speak } from '@/lib/i18n'
import { language } from '@/lib/multifus'
import { ignore } from '@/lib/utils'

const speakThenShow = async (root: Root, screen: React.ReactNode) => {
  const spoken = await language().catch(() => {
    return SOURCE_LANGUAGE
  })

  speak(spoken)

  root.render(<React.StrictMode>{screen}</React.StrictMode>)
}

export const mount = (page: string, screen: React.ReactNode) => {
  const rootElement = document.querySelector('#root')

  if (!rootElement) {
    throw new Error(`Root element #root is missing from ${page}`)
  }

  speakThenShow(ReactDOM.createRoot(rootElement), screen).catch(ignore)
}
