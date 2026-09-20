import abraknydeAncestral from '@multifus/ankama/monsters/abraknyde-ancestral.png'
import batofu from '@multifus/ankama/monsters/batofu.png'
import blops from '@multifus/ankama/monsters/blops.png'
import bouftouRoyal from '@multifus/ankama/monsters/bouftou-royal.png'
import bulbig from '@multifus/ankama/monsters/bulbig.png'
import bworker from '@multifus/ankama/monsters/bworker.png'
import bworkette from '@multifus/ankama/monsters/bworkette.png'
import chafer from '@multifus/ankama/monsters/chafer.png'
import cheneMou from '@multifus/ankama/monsters/chene-mou.png'
import corailleurMagistral from '@multifus/ankama/monsters/corailleur-magistral.png'
import craqueleurLegendaire from '@multifus/ankama/monsters/craqueleur-legendaire.png'
import crocabulia from '@multifus/ankama/monsters/crocabulia.png'
import dragonCochon from '@multifus/ankama/monsters/dragon-cochon.png'
import forgeron from '@multifus/ankama/monsters/forgeron.png'
import gourloLeTerrible from '@multifus/ankama/monsters/gourlo-le-terrible.png'
import kimbo from '@multifus/ankama/monsters/kimbo.png'
import koulosse from '@multifus/ankama/monsters/koulosse.png'
import kralamoureGeant from '@multifus/ankama/monsters/kralamoure-geant.png'
import maitreCorbac from '@multifus/ankama/monsters/maitre-corbac.png'
import maitrePandore from '@multifus/ankama/monsters/maitre-pandore.png'
import meulou from '@multifus/ankama/monsters/meulou.png'
import milimulou from '@multifus/ankama/monsters/milimulou.png'
import minotoror from '@multifus/ankama/monsters/minotoror.png'
import minotot from '@multifus/ankama/monsters/minotot.png'
import mobLEponge from '@multifus/ankama/monsters/mob-l-eponge.png'
import moon from '@multifus/ankama/monsters/moon.png'
import ougah from '@multifus/ankama/monsters/ougah.png'
import pekiPeki from '@multifus/ankama/monsters/peki-peki.png'
import ratBlanc from '@multifus/ankama/monsters/rat-blanc.png'
import ratNoir from '@multifus/ankama/monsters/rat-noir.png'
import sapik from '@multifus/ankama/monsters/sapik.png'
import scarabosseDore from '@multifus/ankama/monsters/scarabosse-dore.png'
import shinLarve from '@multifus/ankama/monsters/shin-larve.png'
import silfLeRasboulMajeur from '@multifus/ankama/monsters/silf-le-rasboul-majeur.png'
import skeunk from '@multifus/ankama/monsters/skeunk.png'
import sphincterCell from '@multifus/ankama/monsters/sphincter-cell.png'
import tanukouiSan from '@multifus/ankama/monsters/tanukoui-san.png'
import tofuRoyal from '@multifus/ankama/monsters/tofu-royal.png'
import tournesolAffame from '@multifus/ankama/monsters/tournesol-affame.png'
import tynril from '@multifus/ankama/monsters/tynril.png'
import waWabbit from '@multifus/ankama/monsters/wa-wabbit.png'

type Monster = Readonly<{
  name: string
  src: string
  footSpan: number
  footRise: number
  scale: number
}>

export const MONSTER_SPAN = 100

export const MONSTER_RISE = 120

export const MONSTERS = [
  {
    name: 'abraknyde-ancestral',
    src: abraknydeAncestral,
    footSpan: 50,
    footRise: 119,
    scale: 1
  },
  {
    name: 'batofu',
    src: batofu,
    footSpan: 50,
    footRise: 101,
    scale: 1
  },
  {
    name: 'blops',
    src: blops,
    footSpan: 49,
    footRise: 104,
    scale: 1
  },
  {
    name: 'bouftou-royal',
    src: bouftouRoyal,
    footSpan: 50,
    footRise: 100,
    scale: 1
  },
  {
    name: 'bulbig',
    src: bulbig,
    footSpan: 55,
    footRise: 116,
    scale: 1
  },
  {
    name: 'bworker',
    src: bworker,
    footSpan: 49,
    footRise: 102,
    scale: 1
  },
  {
    name: 'bworkette',
    src: bworkette,
    footSpan: 48,
    footRise: 118,
    scale: 1
  },
  {
    name: 'chafer',
    src: chafer,
    footSpan: 52,
    footRise: 118,
    scale: 1
  },
  {
    name: 'chene-mou',
    src: cheneMou,
    footSpan: 50,
    footRise: 100,
    scale: 1
  },
  {
    name: 'corailleur-magistral',
    src: corailleurMagistral,
    footSpan: 51,
    footRise: 116,
    scale: 1
  },
  {
    name: 'craqueleur-legendaire',
    src: craqueleurLegendaire,
    footSpan: 50,
    footRise: 113,
    scale: 1
  },
  {
    name: 'crocabulia',
    src: crocabulia,
    footSpan: 49,
    footRise: 118,
    scale: 1
  },
  {
    name: 'dragon-cochon',
    src: dragonCochon,
    footSpan: 51,
    footRise: 107,
    scale: 1
  },
  {
    name: 'forgeron',
    src: forgeron,
    footSpan: 47,
    footRise: 119,
    scale: 1
  },
  {
    name: 'gourlo-le-terrible',
    src: gourloLeTerrible,
    footSpan: 49,
    footRise: 119,
    scale: 1
  },
  {
    name: 'kimbo',
    src: kimbo,
    footSpan: 47,
    footRise: 117,
    scale: 1
  },
  {
    name: 'koulosse',
    src: koulosse,
    footSpan: 49,
    footRise: 119,
    scale: 1
  },
  {
    name: 'kralamoure-geant',
    src: kralamoureGeant,
    footSpan: 51,
    footRise: 91,
    scale: 1
  },
  {
    name: 'maitre-corbac',
    src: maitreCorbac,
    footSpan: 51,
    footRise: 113,
    scale: 1
  },
  {
    name: 'maitre-pandore',
    src: maitrePandore,
    footSpan: 51,
    footRise: 109,
    scale: 1
  },
  {
    name: 'meulou',
    src: meulou,
    footSpan: 50,
    footRise: 118,
    scale: 1
  },
  {
    name: 'milimulou',
    src: milimulou,
    footSpan: 49,
    footRise: 118,
    scale: 1
  },
  {
    name: 'minotoror',
    src: minotoror,
    footSpan: 49,
    footRise: 119,
    scale: 1
  },
  {
    name: 'minotot',
    src: minotot,
    footSpan: 50,
    footRise: 116,
    scale: 1
  },
  {
    name: 'mob-l-eponge',
    src: mobLEponge,
    footSpan: 50,
    footRise: 105,
    scale: 1
  },
  {
    name: 'moon',
    src: moon,
    footSpan: 50,
    footRise: 119,
    scale: 1
  },
  {
    name: 'ougah',
    src: ougah,
    footSpan: 51,
    footRise: 113,
    scale: 1
  },
  {
    name: 'peki-peki',
    src: pekiPeki,
    footSpan: 50,
    footRise: 108,
    scale: 1
  },
  {
    name: 'rat-blanc',
    src: ratBlanc,
    footSpan: 49,
    footRise: 118,
    scale: 1
  },
  {
    name: 'rat-noir',
    src: ratNoir,
    footSpan: 51,
    footRise: 117,
    scale: 1
  },
  {
    name: 'sapik',
    src: sapik,
    footSpan: 47,
    footRise: 119,
    scale: 1
  },
  {
    name: 'scarabosse-dore',
    src: scarabosseDore,
    footSpan: 52,
    footRise: 119,
    scale: 1
  },
  {
    name: 'shin-larve',
    src: shinLarve,
    footSpan: 50,
    footRise: 98,
    scale: 1
  },
  {
    name: 'silf-le-rasboul-majeur',
    src: silfLeRasboulMajeur,
    footSpan: 50,
    footRise: 87,
    scale: 1
  },
  {
    name: 'skeunk',
    src: skeunk,
    footSpan: 50,
    footRise: 120,
    scale: 1
  },
  {
    name: 'sphincter-cell',
    src: sphincterCell,
    footSpan: 50,
    footRise: 115,
    scale: 1
  },
  {
    name: 'tanukoui-san',
    src: tanukouiSan,
    footSpan: 50,
    footRise: 111,
    scale: 1
  },
  {
    name: 'tofu-royal',
    src: tofuRoyal,
    footSpan: 48,
    footRise: 103,
    scale: 1
  },
  {
    name: 'tournesol-affame',
    src: tournesolAffame,
    footSpan: 47,
    footRise: 118,
    scale: 1
  },
  {
    name: 'tynril',
    src: tynril,
    footSpan: 49,
    footRise: 119,
    scale: 1
  },
  {
    name: 'wa-wabbit',
    src: waWabbit,
    footSpan: 50,
    footRise: 115,
    scale: 1
  }
] as const satisfies readonly Monster[]
