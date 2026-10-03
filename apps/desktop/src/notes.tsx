import React from 'react'
import { QuietBoundary } from '@/components/quiet-boundary'
import { note } from '@/lib/multifus'
import { NotesWindow } from '@/screens/notes-window'
import { mount } from './boot'
import './notes.css'

const written = note()

mount(
  'notes.html',
  <QuietBoundary>
    <React.Suspense>
      <NotesWindow written={written} />
    </React.Suspense>
  </QuietBoundary>
)
