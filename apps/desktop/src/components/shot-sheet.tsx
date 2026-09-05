import type React from 'react'
import { DialogContent, DialogTitle } from '@/components/ui/dialog'

type ShotSheetProps = Readonly<{
  alt: string
  children: React.ReactNode
}>

export const ShotSheet = ({ alt, children }: ShotSheetProps) => {
  return (
    <DialogContent
      showCloseButton={false}
      className="pointer-events-none inset-0 flex max-w-none translate-x-0 translate-y-0 items-center justify-center bg-transparent p-6 ring-0 sm:max-w-none"
    >
      <DialogTitle className="sr-only">{alt}</DialogTitle>
      {children}
    </DialogContent>
  )
}
