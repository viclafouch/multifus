import React from 'react'

/**
 * A field written when it is left and not on every key press. What is stored
 * wins the moment it changes underneath, corrected during the render.
 */
export const useDraft = (stored: string) => {
  const [draft, setDraft] = React.useState(stored)
  const [seen, setSeen] = React.useState(stored)

  if (seen !== stored) {
    setSeen(stored)
    setDraft(stored)
  }

  return { draft, setDraft }
}
