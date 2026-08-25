export const CONFIG_NOTICE_STRINGS = {
  config: {
    unreadableTitle: 'Vos réglages n’ont pas pu être lus',
    unreadableBody:
      'Multifus a démarré sur ses réglages d’origine. Votre fichier est toujours là, intact.',
    malformedTitle: 'Vos réglages ont été mis de côté',
    malformedBody:
      'Le fichier n’était plus lisible. Multifus l’a gardé sous un autre nom et repart sur ses réglages d’origine.',
    notSavedTitle: 'Vos réglages n’ont pas été enregistrés',
    notSavedBody:
      'Ce que vous voyez à l’écran est bon, mais rien n’a été écrit sur le disque.',
    notSetAsideTitle: 'Vos réglages illisibles sont toujours en place',
    notSetAsideBody:
      'Multifus n’a pas réussi à mettre le fichier de côté. Le prochain enregistrement l’écrasera. Copiez-le ailleurs si son contenu compte.',
    reveal: 'Montrer le fichier',
    dismiss: 'J’ai compris'
  }
} as const
