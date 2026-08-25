import React from 'react'

export const useDraft = (stored: string) => {
  const [draft, setDraft] = React.useState(stored)
  const [seen, setSeen] = React.useState(stored)

  if (seen !== stored) {
    setSeen(stored)
    setDraft(stored)
  }

  return { draft, setDraft }
}
