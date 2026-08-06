/** The words of the drawer at the foot of the window, its two exports included. */

export const JOURNAL_PANEL_STRINGS = {
  journal: {
    title: 'Journal',
    empty: 'Rien à signaler pour l’instant.',
    show: 'Afficher le journal',
    hide: 'Masquer le journal',
    copy: 'Copier le journal',
    copied: 'Journal copié',
    // The drawer shows what is in memory. The file holds weeks, and saying so is
    // what stops somebody from scrolling up looking for last Tuesday.
    reveal: 'Montrer le fichier du journal',
    entries: (count: number) => {
      return count === 1 ? '1 entrée' : `${count} entrées`
    }
  }
} as const
