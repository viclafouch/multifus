import { msg } from '@lingui/core/macro'
import type { Body } from '@/@types/body'
import type { PageId } from '@/@types/page'

export const PAGE_BODIES = {
  home: null,
  autoFocus: {
    lead: msg`Vous jouez sur votre Iop, et c’est votre Eniripsa qu’on invite en groupe. Sa fenêtre arrive devant vous toute seule, et vous lisez l’invitation avant même d’avoir cherché où elle était.`,
    passages: [
      {
        title: msg`Sept appels, sept fois la bonne fenêtre`,
        lines: [
          msg`Le jeu vous appelle de sept façons : c’est à votre tour de jouer, quelqu’un vous propose un échange, on vous invite dans un groupe ou une guilde, quelqu’un vous écrit en privé, quelqu’un vous lance un défi, on vous appelle pour un craft, votre percepteur est attaqué. Chacun de ces sept appels amène devant vous la fenêtre du personnage concerné.`,
          msg`C’est toute la liste. Multifus n’en invente pas un huitième et ne devine rien : il attend que le jeu parle.`
        ]
      },
      {
        title: msg`Le tour de combat que vous ne ratez plus`,
        lines: [
          msg`Le pire moment du multicompte, c’est le combat à plusieurs personnages : le chrono tourne pendant que vous cherchez lequel de vos quatre clients attend votre clic. La fenêtre du personnage dont c’est le tour est maintenant devant vous quand le tour arrive.`,
          msg`Le gain se compte en secondes par tour, et un combat de Dofus Retro en compte des dizaines.`
        ]
      },
      {
        title: msg`Vous décidez qui a le droit de vous déranger`,
        lines: [
          msg`Les sept appels ont chacun leur interrupteur. Si les crafts des autres ne vous intéressent pas, vous coupez celui-là et vous gardez les six autres.`,
          msg`Un personnage que vous mettez de côté ne fait plus passer sa fenêtre devant : votre mule reste en banque pendant que vous jouez, et elle revient dans le rang d’un clic.`,
          msg`L’AutoFocus s’éteint d’un interrupteur, sans fermer Multifus, et tout le reste continue de marcher.`
        ]
      }
    ],
    limit: {
      title: msg`Ce que l’AutoFocus ne fait pas`,
      lines: [
        msg`Il ne joue à votre place sur aucun personnage : il ne clique pas, il ne lance aucun sort, il ne répond à personne. Il vous emmène là où on vous appelle, et tout le reste est à vous.`,
        msg`Il ne lit pas non plus ce qui se passe dans le jeu. Il entend ce que le jeu annonce lui-même, rien de plus, et il se tait pour un personnage que vous avez mis de côté.`
      ]
    }
  },
  wheel: {
    lead: msg`Vous maintenez une combinaison, un disque de têtes s’ouvre au milieu de l’écran, vous visez celle que vous voulez, vous lâchez. La fenêtre est devant vous. Le geste tient en une seconde : une main tient la combinaison, l’autre vise.`,
    passages: [
      {
        title: msg`Viser vaut mieux que se souvenir`,
        lines: [
          msg`Une touche par personnage marche jusqu’à trois ou quatre. À huit, vous ne savez plus si votre Crâ est sur F5 ou sur F6, et vous passez plus de temps à chercher la touche qu’à jouer.`,
          msg`La roue ne demande rien à votre mémoire : les têtes sont là, vous reconnaissez la classe et le pseudo, vous partez dessus. Elle s’ouvre toujours au même endroit de l’écran, où que soit votre souris.`
        ]
      },
      {
        title: msg`Ce qu’il y a sur le disque`,
        lines: [
          msg`Chaque part porte la tête de classe d’un personnage et son pseudo dessous. Le centre porte celle du personnage d’où vous partez, pour que vous sachiez toujours où vous êtes.`,
          msg`Seuls les personnages connectés y sont : aller sur un écran de connexion ne sert à rien. Et deux Sadidas femmes que le portrait ne sépare plus se séparent par la couleur que vous leur avez donnée.`
        ]
      },
      {
        title: msg`Annuler est aussi simple qu’aller`,
        lines: [
          msg`Lâchez au centre ou hors du disque : il ne se passe rien, et vous restez où vous êtes. Un geste commencé par erreur ne coûte pas une fenêtre.`,
          msg`Tant que le disque est ouvert, le jeu ne voit plus votre souris. Rien ne s’allume derrière, aucun sort ne part, aucun personnage ne se déplace.`
        ]
      }
    ],
    limit: {
      title: msg`Ce que la roue ne fait pas`,
      lines: [
        msg`Elle ne bouge jamais votre curseur. C’est votre main qui vient sur le disque, jamais le disque qui vient chercher votre main.`,
        msg`Elle ne montre pas vos personnages déconnectés et elle ne les reconnecte pas. Et elle ne ramène qu’une fenêtre à la fois, celle que vous avez visée.`
      ]
    }
  },
  walk: {
    lead: msg`Vous allumez le Déplacement rapide, vous cliquez là où vous voulez aller, et c’est le personnage suivant qui arrive devant vous. Vous cliquez encore, le suivant arrive. Quatre clics, et vos quatre personnages ont changé de map sans que votre main quitte la souris.`,
    passages: [
      {
        title: msg`Le trajet à quatre personnages`,
        lines: [
          msg`Emmener une team d’Astrub à Amakna, c’est une vingtaine de maps et autant d’allers-retours entre les fenêtres pour chacune. Le nombre de clics ne change pas ; ce qui disparaît, c’est la recherche entre chaque clic.`,
          msg`Une petite bannière se pose au coin de l’écran et dit sur quel personnage vous venez d’arriver, pour que vous ne cliquiez pas dans le vide. Vous choisissez le coin.`
        ]
      },
      {
        title: msg`L’ordre du tour est le vôtre`,
        lines: [
          msg`Le défilement suit l’ordre que vous avez rangé à la main, et vous pouvez en sortir un personnage : la mule que vous laissez en banque ne prendra aucun de vos clics.`
        ]
      },
      {
        title: msg`Il ne s’allume jamais tout seul`,
        lines: [
          msg`Multifus démarre toujours avec le Déplacement rapide éteint, et il ne s’allume que par un geste de votre part, un interrupteur ou une touche. Il s’éteint seul dès qu’il n’a plus de fenêtre où aller.`,
          msg`C’est voulu : un mécanisme qui prend vos clics doit être quelque chose que vous avez demandé, et que vous coupez aussi vite.`
        ]
      }
    ],
    limit: {
      title: msg`Ce que le Déplacement rapide ne fait pas`,
      lines: [
        msg`Il ne déplace pas plusieurs personnages d’un seul clic. Chaque clic vaut pour le personnage qui est devant vous, et pour lui seul. Les macros qui font marcher toute une team ensemble sont bannissables, et elles restent hors de ce projet.`,
        msg`Il ne vise pas à votre place non plus : c’est vous qui cliquez sur la case, Multifus ne fait que vous poser devant la fenêtre suivante.`
      ]
    }
  },
  runeTable: {
    lead: msg`Le tableau des poids de runes se pose par-dessus la fenêtre du jeu, à la touche que vous avez choisie. Vous brisez, vous lisez le poids, vous continuez. L’atelier ne se quitte pas, et le navigateur reste fermé.`,
    passages: [
      {
        title: msg`La forgemagie sans le deuxième écran`,
        lines: [
          msg`Un joueur qui brise en série garde un onglet ouvert sur une table de poids, et il fait l’aller-retour à chaque objet. Sur un seul écran, ça veut dire quitter le jeu des dizaines de fois par session.`,
          msg`Le tableau se pose où vous voulez sur la fenêtre, il y reste d’un lancement à l’autre, et il la suit quand vous la déplacez.`
        ]
      },
      {
        title: msg`Il se règle pour ne pas gêner`,
        lines: [
          msg`La taille se règle d’un bloc, écriture comprise, et la transparence va du tableau qui couvre le jeu au tableau presque fantôme : poussé à fond, il garde toujours de quoi se lire.`,
          msg`Un interrupteur décide s’il ne suit que le personnage où vous l’avez ouvert, ou tous ceux qui sont connectés. En général, un seul personnage forge.`,
          msg`Il se prend n’importe où et se porte à la main. Un clic dessus ne fait pas sauter Multifus devant : le jeu garde le premier plan pendant tout le déplacement.`
        ]
      },
      {
        title: msg`Perdu de vue, il revient`,
        lines: [
          msg`La même touche le cache et le rappelle. S’il a fini derrière une fenêtre ou hors de l’écran, un bouton le repose au coin de la fenêtre du jeu.`
        ]
      }
    ],
    limit: {
      title: msg`Ce que le tableau des runes ne fait pas`,
      lines: [
        msg`Il ne lit rien dans le jeu. Il ne sait pas ce que vous brisez, il ne compte pas vos runes et il ne calcule aucune probabilité : c’est une table posée devant vous, et c’est vous qui lisez.`,
        msg`Il ne se pose pas sur un client en plein écran, qui prend un bureau à lui et ne laisse de place à rien d’autre. Une fenêtre agrandie fait mieux le travail.`
      ]
    }
  },
  shortcuts: {
    lead: msg`Une touche par personnage, et vous y êtes. F1 sur l’Eniripsa, F2 sur le Sacrieur, et le tour de votre roster au clavier sans lâcher ce que vous faites.`,
    passages: [
      {
        title: msg`Trois touches qui ne changent jamais`,
        lines: [
          msg`Personnage suivant, personnage précédent, personnage principal. Les deux premières font le tour de votre roster dans l’ordre que vous avez rangé ; la troisième vous ramène sur votre principal où que vous soyez, et c’est celle qu’on garde sous le pouce.`
        ]
      },
      {
        title: msg`Et une touche par personnage`,
        lines: [
          msg`À côté, chaque personnage peut avoir la sienne, rangée comme vous voulez.`,
          msg`Multifus écrit la lettre qui est imprimée sur votre clavier : sur un AZERTY, il affiche Z là où un QWERTY affiche W. Vous lisez ce qui est sur la touche, et vous appuyez dessus.`
        ]
      },
      {
        title: msg`Elles ne valent que dans le jeu`,
        lines: [
          msg`Une combinaison n’est prise que pendant que le jeu est devant vous. Dès que vous passez sur votre navigateur ou sur Discord, la touche vous est rendue.`,
          msg`Un raccourci de Multifus ne coûte donc rien au reste de votre machine, et vous pouvez lui donner une touche dont vous vous servez ailleurs.`
        ]
      }
    ],
    limit: {
      title: msg`Ce que les raccourcis ne font pas`,
      lines: [
        msg`Ils ne frappent rien dans le jeu. Aucune touche de Multifus n’envoie un sort, un déplacement ou un message à votre place : elles changent de fenêtre, ou elles commandent Multifus lui-même, agrandir vos clients ou vérifier vos réglages.`,
        msg`Et une touche ne vaut jamais pour plusieurs personnages à la fois.`
      ]
    }
  },
  relay: {
    lead: msg`Vous êtes parti manger, vos personnages sont restés connectés, et quelqu’un vous écrit en privé. Votre téléphone vous dit lequel de vos personnages vient d’être appelé.`,
    passages: [
      {
        title: msg`Le commerce ne s’arrête pas quand vous partez`,
        lines: [
          msg`Une annonce en vente, et les réponses arrivent quand elles veulent. Sans relais, vous les découvrez une heure plus tard, et l’acheteur est déjà reparti.`,
          msg`Avec, votre téléphone vous prévient, et vous décidez si ça vaut le retour.`,
          msg`C’est un interrupteur, et vous le tenez : vous le mettez en marche avant de vous lever, et vous le coupez en revenant.`
        ]
      },
      {
        title: msg`Par Telegram, et personnage par personnage`,
        lines: [
          msg`Les messages partent dans une conversation Telegram à vous. Vous choisissez qui est suivi : votre principal oui, vos mules non.`,
          msg`Chaque message nomme le personnage appelé, parce qu’à quatre connectés la question se pose. Un réglage y ajoute le texte reçu ; laissé de côté, vous savez seulement qu’on vous a écrit.`
        ]
      },
      {
        title: msg`Il vous dit aussi quand il se tait`,
        lines: [
          msg`Dofus Retro déconnecte tout seul un personnage qui ne fait rien depuis un moment. Quand ça arrive, le relais se tait pour lui, et il vous le dit plutôt que de vous laisser croire que personne ne vous écrit.`
        ]
      }
    ],
    limit: {
      title: msg`Ce que les messages privés ne font pas`,
      lines: [
        msg`Vous ne répondez pas depuis votre téléphone. Le relais va dans un sens, du jeu vers vous. Répondre demande de revenir devant votre écran, et c’est voulu.`,
        msg`Il ne relaie que les messages privés : rien du canal commerce, rien de la guilde, rien du recrutement.`
      ]
    }
  },
  quickReplies: {
    lead: msg`Vous rangez une phrase sous une combinaison de touches. Dans le jeu, vous appuyez, et la phrase se pose là où vous êtes en train d’écrire. Vous relisez, vous appuyez sur Entrée, et c’est parti.`,
    passages: [
      {
        title: msg`Les phrases qu’on retape vingt fois par jour`,
        lines: [
          msg`Je vends des runes, écrivez-moi en privé. Je reviens dans deux minutes. Bienvenue dans la guilde. Ce sont toujours les mêmes phrases, elles sont longues à taper, et vous les tapez au pire moment, pendant un combat ou au milieu d’un échange.`,
          msg`Une réponse rapide les range sous une touche, et vous les retrouvez sur n’importe lequel de vos personnages.`
        ]
      },
      {
        title: msg`Elle se colle, elle ne s’envoie pas`,
        lines: [
          msg`Multifus pose le texte dans votre ligne de discussion, et s’arrête là. C’est vous qui appuyez sur Entrée : vous voyez toujours ce qui part avant que ça parte, et vous pouvez encore le corriger.`,
          msg`Une phrase qui s’enverrait toute seule finirait un jour dans le mauvais canal.`
        ]
      },
      {
        title: msg`Écrites dans la langue de votre jeu`,
        lines: [
          msg`Celle qu’un premier lancement vous offre est en français, même si vous lisez Multifus en anglais : une réponse rapide se tape dans le jeu, et la langue de votre client Dofus n’est pas celle de Multifus. Les vôtres, vous les écrivez comme vous voulez.`
        ]
      }
    ],
    limit: {
      title: msg`Ce que les réponses rapides ne font pas`,
      lines: [
        msg`Elles ne répondent à personne à votre place. Rien ne part sans que vous ayez appuyé sur Entrée, et Multifus ne lit pas ce qu’on vous a écrit.`,
        msg`Une réponse rapide tient sur une ligne. Elle pose du texte, et elle ne fait rien d’autre.`
      ]
    }
  },
  mac: {
    lead: msg`Multifus tourne sur macOS avec les mêmes mécanismes que sur Windows. Le paquet est signé par un identifiant de développeur Apple et notarisé par Apple : il s’ouvre normalement, et votre Mac vous dit qui l’a construit.`,
    passages: [
      {
        title: msg`Le multicompte sur Mac n’avait presque personne`,
        lines: [
          msg`Les gestionnaires de fenêtres pour Dofus Retro sont des logiciels Windows, et un joueur sur Mac finit par monter une machine virtuelle ou par s’en passer. Un seul autre outil vise le Mac aujourd’hui, et il n’avance plus.`,
          msg`Multifus est construit pour les deux systèmes à partir du même code. La version Mac n’est pas un portage fait après coup.`
        ]
      },
      {
        title: msg`Rien à contourner pour l’installer`,
        lines: [
          msg`Vous n’aurez pas à passer par un clic droit pour forcer l’ouverture, ni à écarter un avertissement qui dit que l’auteur n’a pas pu être vérifié.`,
          msg`La signature et la notarisation coûtent de l’argent tous les ans, et c’est exactement pour ça que si peu de projets gratuits les font. Le comparatif dit qui publie un paquet signé, et cette colonne-là est presque vide.`
        ]
      },
      {
        title: msg`Les mêmes mécanismes, les mêmes touches`,
        lines: [
          msg`L’AutoFocus, la roue des personnages, le Déplacement rapide, le tableau des runes, les raccourcis, les réponses rapides et les messages privés sont tous là.`,
          msg`Multifus écrit la touche telle qu’elle est imprimée sur votre clavier, AZERTY comme QWERTY.`
        ]
      }
    ],
    limit: {
      title: msg`Ce que Multifus ne fait pas sur Mac`,
      lines: [
        msg`Il ne vise pas les Mac à processeur Intel : le paquet est construit pour Apple Silicon.`,
        msg`Il ne range pas votre Dock comme il range la barre des tâches de Windows : le pseudo seul, la tête de classe et le bouton par personnage n’existent que là-bas.`,
        msg`Et il ne vous conseille pas le plein écran. Un client en plein écran prend un bureau à lui : passer d’une fenêtre à l’autre devient un glissement d’un bureau à l’autre, et le tableau des runes n’a plus où se poser. Une fenêtre agrandie fait mieux le travail.`
      ]
    }
  },
  comparison: null,
  runeWeights: null,
  download: null,
  journal: null,
  images: null
} as const satisfies Record<PageId, Body | null>
