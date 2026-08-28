export const QUICK_REPLIES_STRINGS = {
  quickReplies: {
    title: 'Réponses rapides',
    subtitle:
      'Les réponses que vous retapez tous les soirs, rangées sous des touches. Frappez-les dans Dofus Retro, Multifus colle le texte là où vous écrivez.',
    add: 'Ajouter une réponse',
    example: 'Bon jeu à toi !',
    textLabel: 'Texte de la réponse',
    remove: 'Retirer cette réponse',
    edit: (rank: number) => {
      return `Modifier les touches de la réponse ${rank}`
    },
    editNamed: (rank: number, text: string) => {
      return `Modifier les touches de la réponse ${rank}, « ${text} »`
    },
    blank: 'Sans texte, il n’y aura rien à coller.',
    emptyTitle: 'Aucune réponse rangée',
    emptyBody:
      'Une réponse, des touches, et vous ne la retapez plus de la soirée.',
    named: (text: string) => {
      return `la réponse « ${text} »`
    },
    unnamed: 'une réponse sans texte',
    clipboard:
      'Multifus colle, c’est vous qui appuyez sur Entrée. Le temps du collage, il emprunte votre presse-papiers, puis vous le rend.'
  }
} as const
