import { matchIsPlural } from '@/helpers/format'

export const JOURNAL_PANEL_STRINGS = {
  journal: {
    title: 'Journal',
    empty: 'Rien à signaler pour l’instant.',
    show: 'Afficher le journal',
    hide: 'Masquer le journal',
    copy: 'Copier le journal',
    copied: 'Journal copié',
    reveal: 'Montrer le fichier du journal',
    entries: (count: number) => {
      return matchIsPlural(count) ? `${count} entrées` : `${count} entrée`
    }
  }
} as const
