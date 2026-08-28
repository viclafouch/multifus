export const QUICK_REPLIES_STRINGS = {
  quickReplies: {
    title: 'Réponses rapides',
    subtitle:
      'Les phrases que vous retapez tous les soirs, rangées sous des touches. Frappez-les dans Dofus Retro, Multifus colle le texte là où vous écrivez.',
    add: 'Ajouter une phrase',
    placeholder: 'Bon jeu à toi !',
    textLabel: 'Texte de la réponse',
    remove: 'Retirer cette réponse',
    edit: 'Modifier les touches de cette réponse',
    editNamed: (text: string) => {
      return `Modifier les touches de « ${text} »`
    },
    blank: 'Sans texte, il n’y aura rien à coller.',
    emptyTitle: 'Aucune phrase rangée',
    emptyBody:
      'Une phrase, des touches, et vous ne la retapez plus de la soirée.',
    emptyMark: 'Bon jeu à toi !',
    named: (text: string) => {
      return `la réponse « ${text} »`
    },
    unnamed: 'une réponse sans texte',
    clipboard:
      'Multifus colle, c’est vous qui appuyez sur Entrée. Le temps du collage, il emprunte votre presse-papiers, puis vous le rend.'
  }
} as const
