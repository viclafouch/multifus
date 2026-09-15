import { INK } from '@/constants/ink'
import { OG_HEIGHT, OG_WIDTH } from '@/constants/og'
import { SITE_DOMAIN } from '@/constants/site'
import { INDEPENDENCE, PAGE_NAMES, PAGE_PROMISES } from '@/constants/wording'
import type { PathParams } from '@/helpers/page'
import { SPEAKERS } from '@/lib/i18n'
import { OG_FONTS } from '@/og/fonts'
import {
  ENGRAVE,
  FLOOR,
  GRAIN,
  inkedWith,
  LIMELIGHT,
  SCRIM,
  SHEET,
  THREAD
} from '@/og/layers'

const CARVE = OG_FONTS.carve.name

const PLAIN = OG_FONTS.plain.name

const GAME = 'DOFUS RETRO'

const SYSTEMS = 'MACOS · WINDOWS'

const legendOf = (color: string) => {
  return {
    display: 'flex',
    fontFamily: CARVE,
    fontSize: 25,
    letterSpacing: '0.3em',
    textShadow: LIMELIGHT,
    color
  } as const
}

type OgCardProps = PathParams &
  Readonly<{
    decor: string
    logo: string
  }>

export const OgCard = ({ page, language, decor, logo }: OgCardProps) => {
  const speaker = SPEAKERS[language]
  const name = speaker._(PAGE_NAMES[page]).toLocaleUpperCase(language)

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: '54px 62px',
        fontFamily: PLAIN,
        backgroundColor: INK.iron
      }}
    >
      <img
        src={decor}
        alt=""
        width={OG_WIDTH}
        height={OG_HEIGHT}
        style={{
          ...SHEET,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: 'saturate(0.88)'
        }}
      />
      <div style={{ ...SHEET, backgroundImage: FLOOR }} />
      <div style={{ ...SHEET, backgroundImage: SCRIM }} />
      <div
        style={{
          ...SHEET,
          backgroundImage: GRAIN,
          opacity: 0.09,
          mixBlendMode: 'overlay'
        }}
      />
      <div
        style={{
          ...SHEET,
          top: 22,
          right: 22,
          bottom: 22,
          left: 22,
          borderRadius: 16,
          border: `1px solid ${inkedWith(INK.band, 0.22)}`
        }}
      />
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 2,
              transform: 'rotate(45deg)',
              backgroundColor: INK.leafLit
            }}
          />
          <div style={legendOf(INK.khaki)}>{GAME}</div>
        </div>
      </div>
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          marginTop: 26,
          marginBottom: 26
        }}
      >
        <div
          style={{
            display: 'flex',
            fontFamily: CARVE,
            fontSize: 112,
            lineHeight: 0.88,
            letterSpacing: '-0.02em',
            color: INK.cream,
            textShadow: LIMELIGHT
          }}
        >
          {name}
        </div>
        <div
          style={{
            height: 3,
            width: 180,
            marginTop: 28,
            marginBottom: 28,
            borderRadius: 3,
            backgroundImage: THREAD
          }}
        />
        <div
          style={{
            display: 'flex',
            maxWidth: 780,
            fontSize: 34,
            lineHeight: 1.4,
            color: INK.khaki,
            textShadow: ENGRAVE
          }}
        >
          {speaker._(PAGE_PROMISES[page])}
        </div>
      </div>
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ ...legendOf(INK.khaki), fontSize: 21 }}>{SYSTEMS}</div>
          <div
            style={{
              display: 'flex',
              fontSize: 19,
              color: inkedWith(INK.khaki, 0.82),
              textShadow: LIMELIGHT
            }}
          >
            {speaker._(INDEPENDENCE)}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img src={logo} alt="" width={44} height={44} />
          <div
            style={{
              display: 'flex',
              fontFamily: CARVE,
              fontSize: 30,
              letterSpacing: '0.05em',
              color: INK.cream,
              textShadow: LIMELIGHT
            }}
          >
            {SITE_DOMAIN}
          </div>
        </div>
      </div>
    </div>
  )
}
