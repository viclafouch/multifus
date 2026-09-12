import { msg } from '@lingui/core/macro'
import type { Body } from '@/@types/body'
import type { PageId } from '@/@types/page'

export const PAGE_BODIES = {
  home: null,
  autoFocus: {
    lead: msg`Vous jouez sur votre Iop, et c’est votre Eniripsa qu’on invite en groupe. Sa fenêtre arrive devant vous toute seule.`,
    passages: [
      {
        title: msg`Sept appels, sept fois la bonne fenêtre`,
        points: [
          {
            lead: msg`C’est à votre tour de jouer.`,
            line: msg`La fenêtre du personnage qui doit jouer arrive devant vous avant que le chrono ne descende.`
          },
          {
            lead: msg`On vous écrit, on vous invite, on vous défie.`,
            line: msg`Échange, groupe, guilde, message privé, défi, craft, percepteur attaqué : sept appels, et pas un de plus.`
          }
        ]
      },
      {
        title: msg`Vous décidez qui a le droit de vous déranger`,
        points: [
          {
            lead: msg`Chaque appel a son interrupteur.`,
            line: msg`Les crafts des autres ne vous intéressent pas ? Vous coupez celui-là et vous gardez les six autres.`
          },
          {
            lead: msg`Une mule se met de côté.`,
            line: msg`Sa fenêtre ne passe plus devant tant que vous ne l’avez pas remise dans le rang.`
          },
          {
            lead: msg`Il s’éteint d’un interrupteur.`,
            line: msg`Sans fermer Multifus, et tout le reste continue de marcher.`
          }
        ]
      }
    ],
    limit: {
      title: msg`Ce que l’AutoFocus ne fait pas`,
      points: [
        {
          lead: msg`Il ne joue pas à votre place.`,
          line: msg`Aucun clic, aucun sort, aucune réponse : il vous emmène, et le reste est à vous.`
        },
        {
          lead: msg`Il ne regarde pas dans le jeu.`,
          line: msg`Il entend ce que le jeu annonce lui-même, et rien d’autre.`
        }
      ]
    }
  },
  wheel: {
    lead: msg`Vous maintenez une combinaison, un disque de têtes s’ouvre au milieu de l’écran, vous visez, vous lâchez. La fenêtre est devant vous.`,
    passages: [
      {
        title: msg`Viser vaut mieux que se souvenir`,
        points: [
          {
            lead: msg`Une touche par personnage tient jusqu’à quatre.`,
            line: msg`À huit, vous cherchez si votre Crâ est sur F5 ou sur F6 plus longtemps que vous ne jouez.`
          },
          {
            lead: msg`La roue ne demande rien à votre mémoire.`,
            line: msg`Vous reconnaissez la tête de classe et le pseudo, et vous partez dessus.`
          },
          {
            lead: msg`Deux Sadidas femmes se séparent.`,
            line: msg`La couleur que vous leur avez donnée les distingue là où le portrait ne le fait plus.`
          }
        ]
      },
      {
        title: msg`Annuler est aussi simple qu’aller`,
        points: [
          {
            lead: msg`Lâchez au centre, il ne se passe rien.`,
            line: msg`Un geste commencé par erreur ne coûte pas une fenêtre.`
          },
          {
            lead: msg`Le jeu ne voit plus votre souris.`,
            line: msg`Tant que le disque est ouvert, rien ne s’allume derrière et aucun sort ne part.`
          }
        ]
      }
    ],
    limit: {
      title: msg`Ce que la roue ne fait pas`,
      points: [
        {
          lead: msg`Elle ne bouge jamais votre curseur.`,
          line: msg`C’est votre main qui vient sur le disque, jamais l’inverse.`
        },
        {
          lead: msg`Elle ignore vos personnages déconnectés.`,
          line: msg`Elle montre les connectés, et elle ne reconnecte personne.`
        }
      ]
    }
  },
  walk: {
    lead: msg`Vous allumez le Déplacement rapide, vous cliquez là où vous voulez aller, et c’est le personnage suivant qui arrive devant vous. Quatre clics, quatre personnages sur la même map.`,
    passages: [
      {
        title: msg`Le trajet à quatre personnages`,
        points: [
          {
            lead: msg`Le nombre de clics ne change pas.`,
            line: msg`Ce qui disparaît, c’est la recherche de fenêtre entre chaque clic.`
          },
          {
            lead: msg`Une bannière dit où vous êtes.`,
            line: msg`Elle se pose au coin que vous avez choisi et nomme le personnage qui vient d’arriver.`
          },
          {
            lead: msg`L’ordre du défilement est le vôtre.`,
            line: msg`Vous le rangez à la main, et la mule que vous laissez en banque ne prend aucun de vos clics.`
          }
        ]
      },
      {
        title: msg`Il ne s’allume jamais tout seul`,
        points: [
          {
            lead: msg`Multifus démarre toujours avec lui éteint.`,
            line: msg`Un interrupteur ou une touche l’allume, et rien d’autre.`
          },
          {
            lead: msg`Il s’éteint dès qu’il n’a plus où aller.`,
            line: msg`Plus une fenêtre à parcourir, plus un clic à prendre.`
          }
        ]
      }
    ],
    limit: {
      title: msg`Ce que le Déplacement rapide ne fait pas`,
      points: [
        {
          lead: msg`Il ne déplace pas la team d’un seul clic.`,
          line: msg`Chaque clic vaut pour le personnage qui est devant vous, et pour lui seul.`
        },
        {
          lead: msg`Il ne vise pas à votre place.`,
          line: msg`C’est vous qui cliquez sur la case où la team doit aller.`
        }
      ]
    }
  },
  runeTable: {
    lead: msg`Le tableau des poids de runes se pose par-dessus la fenêtre du jeu, à la touche que vous avez choisie. Vous brisez, vous lisez, vous continuez.`,
    passages: [
      {
        title: msg`La forgemagie sans le deuxième écran`,
        points: [
          {
            lead: msg`Le navigateur reste fermé.`,
            line: msg`Plus d’aller-retour vers un onglet à chaque objet brisé.`
          },
          {
            lead: msg`Il garde sa place.`,
            line: msg`Posé où vous voulez, il y revient au lancement suivant et suit la fenêtre quand elle bouge.`
          }
        ]
      },
      {
        title: msg`Il se règle pour ne pas gêner`,
        points: [
          {
            lead: msg`La taille et la transparence se règlent.`,
            line: msg`Poussé à fond, il reste toujours assez visible pour se lire.`
          },
          {
            lead: msg`Le jeu garde le premier plan.`,
            line: msg`Un clic sur le tableau ne fait pas sauter Multifus devant.`
          },
          {
            lead: msg`Perdu de vue, il revient.`,
            line: msg`La même touche le cache et le rappelle, et un bouton le repose au coin de la fenêtre du jeu.`
          }
        ]
      }
    ],
    limit: {
      title: msg`Ce que le tableau des runes ne fait pas`,
      points: [
        {
          lead: msg`Il ne lit rien dans le jeu.`,
          line: msg`Il ne sait pas ce que vous brisez et ne calcule aucune probabilité.`
        },
        {
          lead: msg`Il ne se pose pas sur un client en plein écran.`,
          line: msg`Une fenêtre agrandie fait mieux le travail.`
        }
      ]
    }
  },
  relay: {
    lead: msg`Vous êtes parti manger, vos personnages sont restés connectés, et quelqu’un vous écrit en privé. Votre téléphone vous dit lequel vient d’être appelé.`,
    passages: [
      {
        title: msg`Le commerce ne s’arrête pas quand vous partez`,
        points: [
          {
            lead: msg`Une annonce en vente attend des réponses.`,
            line: msg`Sans relais, vous les découvrez une heure plus tard, et l’acheteur est reparti.`
          },
          {
            lead: msg`C’est un interrupteur, et vous le tenez.`,
            line: msg`En marche avant de vous lever, coupé en revenant.`
          }
        ]
      },
      {
        title: msg`Par Telegram, personnage par personnage`,
        points: [
          {
            lead: msg`Vous choisissez qui est suivi.`,
            line: msg`Votre principal oui, vos mules non.`
          },
          {
            lead: msg`Chaque message nomme le personnage appelé.`,
            line: msg`À quatre connectés, la question se pose à chaque fois.`
          },
          {
            lead: msg`Il vous dit aussi quand il se tait.`,
            line: msg`Dofus Retro déconnecte un personnage qui ne fait rien, et le relais l’annonce plutôt que de vous laisser croire que personne n’écrit.`
          }
        ]
      }
    ],
    limit: {
      title: msg`Ce que les messages privés ne font pas`,
      points: [
        {
          lead: msg`Vous ne répondez pas depuis le téléphone.`,
          line: msg`Le relais va dans un sens, du jeu vers vous.`
        },
        {
          lead: msg`Il ne relaie que le privé.`,
          line: msg`Rien du canal commerce, rien de la guilde, rien du recrutement.`
        }
      ]
    }
  },
  quickReplies: {
    lead: msg`Vous rangez une phrase sous une combinaison de touches. Dans le jeu, vous appuyez, et la phrase se pose là où vous êtes en train d’écrire.`,
    passages: [
      {
        title: msg`Les phrases qu’on retape vingt fois par jour`,
        points: [
          {
            lead: msg`Toujours les mêmes, toujours au pire moment.`,
            line: msg`Je vends des runes, je reviens dans deux minutes, bienvenue dans la guilde.`
          },
          {
            lead: msg`Elles vous suivent partout.`,
            line: msg`Une réponse rapide marche sur n’importe lequel de vos personnages.`
          }
        ]
      },
      {
        title: msg`Elle se colle, elle ne s’envoie pas`,
        points: [
          {
            lead: msg`C’est vous qui appuyez sur Entrée.`,
            line: msg`Vous voyez ce qui part avant que ça parte, et vous pouvez encore le corriger.`
          },
          {
            lead: msg`Une phrase qui partirait seule finirait mal.`,
            line: msg`Un jour, dans le mauvais canal, devant tout le monde.`
          },
          {
            lead: msg`Elles s’écrivent dans la langue du jeu.`,
            line: msg`Celle qu’un premier lancement vous offre est en français, même si vous lisez Multifus en anglais.`
          }
        ]
      }
    ],
    limit: {
      title: msg`Ce que les réponses rapides ne font pas`,
      points: [
        {
          lead: msg`Elles ne répondent à personne à votre place.`,
          line: msg`Multifus ne lit pas ce qu’on vous a écrit.`
        },
        {
          lead: msg`Elles tiennent sur une ligne.`,
          line: msg`Elles posent du texte, et rien d’autre.`
        }
      ]
    }
  },
  mac: {
    lead: msg`Multifus tourne sur macOS avec les mêmes mécanismes que sur Windows. Le paquet est signé et notarisé par Apple, donc il s’ouvre normalement.`,
    passages: [
      {
        title: msg`Le multicompte sur Mac n’avait presque personne`,
        points: [
          {
            lead: msg`Les autres outils sont des logiciels Windows.`,
            line: msg`Un joueur sur Mac finit par monter une machine virtuelle, ou par s’en passer.`
          },
          {
            lead: msg`La version Mac n’est pas un portage.`,
            line: msg`Les deux systèmes sont construits à partir du même code.`
          },
          {
            lead: msg`Les six mécanismes sont là.`,
            line: msg`L’AutoFocus, la roue, le Déplacement rapide, le tableau des runes, les réponses rapides et les messages privés, et la touche s’écrit comme sur votre clavier.`
          }
        ]
      },
      {
        title: msg`Rien à contourner pour l’installer`,
        points: [
          {
            lead: msg`Pas de clic droit pour forcer l’ouverture.`,
            line: msg`Aucun avertissement ne vous dira que l’auteur n’a pas pu être vérifié.`
          },
          {
            lead: msg`Signer coûte de l’argent chaque année.`,
            line: msg`C’est pour ça que si peu de projets gratuits le font, et le comparatif le montre.`
          }
        ]
      }
    ],
    limit: {
      title: msg`Ce que Multifus ne fait pas sur Mac`,
      points: [
        {
          lead: msg`Il ne vise pas les Mac Intel.`,
          line: msg`Le paquet est construit pour Apple Silicon.`
        },
        {
          lead: msg`Il ne range pas votre Dock.`,
          line: msg`Le pseudo, la tête de classe et le bouton par personnage n’existent que sur la barre des tâches de Windows.`
        },
        {
          lead: msg`Il ne vous conseille pas le plein écran.`,
          line: msg`Un client en plein écran prend un bureau à lui, et la bascule devient un glissement d’un bureau à l’autre.`
        }
      ]
    }
  },
  comparison: null,
  download: null,
  journal: null,
  ankama: null
} as const satisfies Record<PageId, Body | null>
