export const CONFIG_NOTICE_STRINGS = {
  config: {
    unreadableTitle: 'Configuration illisible',
    unreadableBody:
      'Le fichier de configuration existe mais n’a pas pu être lu. Multifus tourne sur ses réglages par défaut et n’a rien écrasé.',
    malformedTitle: 'Configuration mise de côté',
    malformedBody:
      'Le fichier de configuration n’était pas exploitable. Il a été renommé plutôt qu’écrasé, et Multifus est reparti sur ses réglages par défaut.',
    notSavedTitle: 'Configuration non enregistrée',
    notSavedBody:
      'La dernière écriture a échoué. Ce qui est à l’écran est correct, ce qui est sur le disque ne l’est pas encore.',
    notSetAsideTitle: 'Configuration illisible et toujours en place',
    notSetAsideBody:
      'Le fichier de configuration n’était pas exploitable, et Multifus n’a pas réussi à le déplacer. Le prochain enregistrement l’écrasera. Copiez-le ailleurs si son contenu compte.',
    reveal: 'Montrer le fichier',
    dismiss: 'J’ai compris'
  }
} as const
