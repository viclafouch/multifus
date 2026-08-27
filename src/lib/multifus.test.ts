import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { InvokeArgs } from '@tauri-apps/api/core'
import { clearMocks, mockIPC } from '@tauri-apps/api/mocks'
import * as multifus from '@/lib/multifus'
import BANNER_SOURCE from '../../src-tauri/src/app/banner.rs?raw'
import COMMANDS_SOURCE from '../../src-tauri/src/app/commands.rs?raw'
import RUNTIME_SOURCE from '../../src-tauri/src/app/runtime.rs?raw'
import HANDLER_SOURCE from '../../src-tauri/src/lib.rs?raw'

declare global {
  // oxlint-disable-next-line consistent-type-definitions -- a global augmentation only takes an interface
  interface Window {
    readonly __TAURI_INTERNALS__: {
      readonly runCallback: (id: number, payload: unknown) => void
    }
  }
}

type Invoked = {
  readonly command: string
  readonly payload: Record<string, unknown>
}

const invoked: Invoked[] = []

const recordOf = (payload?: InvokeArgs): Record<string, unknown> => {
  if (payload === undefined || Array.isArray(payload)) {
    return {}
  }

  return Object.fromEntries(Object.entries(payload))
}

const listenIPC = () => {
  mockIPC((command, payload) => {
    invoked.push({ command, payload: recordOf(payload) })

    return null
  })
}

const LISTEN_COMMAND = 'plugin:event|listen'

const listenedEvent = () => {
  const last = invoked.at(-1)

  if (last?.command !== LISTEN_COMMAND) {
    throw new Error('la dernière commande n’ouvre aucune écoute')
  }

  return last.payload.event
}

const listenedHandler = () => {
  const handler = invoked.at(-1)?.payload.handler

  if (typeof handler !== 'number') {
    throw new TypeError('le greffon n’a rendu aucun identifiant d’écoute')
  }

  return handler
}

const COMMAND_PATTERN = /#\[tauri::command\]\s*pub fn (\w+)\(([^)]*)\)/gu

const parametersOf = (signature: string) => {
  return signature
    .split(',')
    .map((parameter) => {
      return parameter.split(':')[0].trim()
    })
    .filter((name) => {
      return name.length > 0 && name !== 'app'
    })
}

const RUST_COMMANDS = new Map(
  [...COMMANDS_SOURCE.matchAll(COMMAND_PATTERN)].map(
    ([, name, signature]): [string, readonly string[]] => {
      return [name, parametersOf(signature)]
    }
  )
)

const UNKNOWN_COMMAND = ['commands.rs n’expose pas cette commande']

const parametersOfCommand = (command: string) => {
  return RUST_COMMANDS.get(command) ?? UNKNOWN_COMMAND
}

const REGISTERED_COMMANDS = [
  ...HANDLER_SOURCE.matchAll(/app::commands::(\w+)/gu)
].map(([, name]) => {
  return name
})

const rustConstant = (source: string, name: string) => {
  const found = new RegExp(`const ${name}: &str = "([^"]+)"`, 'u').exec(source)

  return found === null ? null : found[1]
}

const snakeCase = (name: string) => {
  return name.replaceAll(/[A-Z]/gu, (letter) => {
    return `_${letter.toLowerCase()}`
  })
}

const alphabetically = (left: string, right: string) => {
  return left.localeCompare(right)
}

const sorted = (names: readonly string[]) => {
  return names.toSorted(alphabetically)
}

type Call = {
  readonly name: string
  readonly run: () => Promise<unknown>
}

const NICKNAME = 'Alpha'

const CALLS = [
  {
    name: 'snapshot',
    run: () => {
      return multifus.snapshot()
    }
  },
  {
    name: 'requestAuthorization',
    run: () => {
      return multifus.requestAuthorization()
    }
  },
  {
    name: 'openAuthorizationSettings',
    run: () => {
      return multifus.openAuthorizationSettings()
    }
  },
  {
    name: 'setGender',
    run: () => {
      return multifus.setGender(NICKNAME, 'male')
    }
  },
  {
    name: 'setClass',
    run: () => {
      return multifus.setClass(NICKNAME, 'iop')
    }
  },
  {
    name: 'toggleExcluded',
    run: () => {
      return multifus.toggleExcluded(NICKNAME)
    }
  },
  {
    name: 'setMain',
    run: () => {
      return multifus.setMain(NICKNAME, true)
    }
  },
  {
    name: 'setGenderExcluded',
    run: () => {
      return multifus.setGenderExcluded('female', true)
    }
  },
  {
    name: 'reorder',
    run: () => {
      return multifus.reorder([NICKNAME])
    }
  },
  {
    name: 'removeCharacter',
    run: () => {
      return multifus.removeCharacter(NICKNAME)
    }
  },
  {
    name: 'setShortcut',
    run: () => {
      return multifus.setShortcut('next', 'Control+Shift+Right')
    }
  },
  {
    name: 'resetShortcuts',
    run: () => {
      return multifus.resetShortcuts()
    }
  },
  {
    name: 'addQuickReply',
    run: () => {
      return multifus.addQuickReply()
    }
  },
  {
    name: 'setQuickReplyText',
    run: () => {
      return multifus.setQuickReplyText(0, 'Bon jeu à toi !')
    }
  },
  {
    name: 'setQuickReplyShortcut',
    run: () => {
      return multifus.setQuickReplyShortcut(0, 'Alt+KeyP')
    }
  },
  {
    name: 'removeQuickReply',
    run: () => {
      return multifus.removeQuickReply(0)
    }
  },
  {
    name: 'setAutoFocus',
    run: () => {
      return multifus.setAutoFocus('combat', true)
    }
  },
  {
    name: 'setAutoFocusEnabled',
    run: () => {
      return multifus.setAutoFocusEnabled(true)
    }
  },
  {
    name: 'setWalkEnabled',
    run: () => {
      return multifus.setWalkEnabled(true)
    }
  },
  {
    name: 'setBannerCorner',
    run: () => {
      return multifus.setBannerCorner('topLeft')
    }
  },
  {
    name: 'setBannerScreen',
    run: () => {
      return multifus.setBannerScreen(null)
    }
  },
  {
    name: 'bannerScreens',
    run: () => {
      return multifus.bannerScreens()
    }
  },
  {
    name: 'bannerStep',
    run: () => {
      return multifus.bannerStep()
    }
  },
  {
    name: 'setWakesMinimized',
    run: () => {
      return multifus.setWakesMinimized(false)
    }
  },
  {
    name: 'setStartAtLogin',
    run: () => {
      return multifus.setStartAtLogin(true)
    }
  },
  {
    name: 'setMaximizeOnLaunch',
    run: () => {
      return multifus.setMaximizeOnLaunch(true)
    }
  },
  {
    name: 'setShortTitles',
    run: () => {
      return multifus.setShortTitles(true)
    }
  },
  {
    name: 'setPaintPortraits',
    run: () => {
      return multifus.setPaintPortraits(false)
    }
  },
  {
    name: 'setUngroupTaskbar',
    run: () => {
      return multifus.setUngroupTaskbar(true)
    }
  },
  {
    name: 'setRelayed',
    run: () => {
      return multifus.setRelayed(NICKNAME, false)
    }
  },
  {
    name: 'setSendBody',
    run: () => {
      return multifus.setSendBody(true)
    }
  },
  {
    name: 'pairRelay',
    run: () => {
      return multifus.pairRelay('123456:jeton')
    }
  },
  {
    name: 'setRelayActive',
    run: () => {
      return multifus.setRelayActive(true)
    }
  },
  {
    name: 'testRelay',
    run: () => {
      return multifus.testRelay()
    }
  },
  {
    name: 'unpairRelay',
    run: () => {
      return multifus.unpairRelay()
    }
  },
  {
    name: 'openRelayLink',
    run: () => {
      return multifus.openRelayLink('botFather')
    }
  },
  {
    name: 'reset',
    run: () => {
      return multifus.reset()
    }
  },
  {
    name: 'checkUpdate',
    run: () => {
      return multifus.checkUpdate()
    }
  },
  {
    name: 'installUpdate',
    run: () => {
      return multifus.installUpdate()
    }
  },
  {
    name: 'dismissConfigProblem',
    run: () => {
      return multifus.dismissConfigProblem()
    }
  },
  {
    name: 'revealJournal',
    run: () => {
      return multifus.revealJournal()
    }
  },
  {
    name: 'revealQuarantinedConfig',
    run: () => {
      return multifus.revealQuarantinedConfig()
    }
  }
] as const satisfies readonly Call[]

const LISTENERS = ['onSnapshot', 'onNavigate', 'onBannerStep']

const lastCall = async (call: Call) => {
  await call.run()

  const last = invoked.at(-1)

  if (last === undefined) {
    throw new Error(`${call.name} n’appelle aucune commande`)
  }

  return last
}

describe('le pont vers Rust', () => {
  beforeEach(() => {
    invoked.length = 0
    listenIPC()
  })

  afterEach(() => {
    clearMocks()
  })

  it('couvre toutes les fonctions du module', () => {
    const covered = CALLS.map((call) => {
      return call.name
    })

    expect(sorted([...covered, ...LISTENERS])).toStrictEqual(
      sorted(Object.keys(multifus))
    )
  })

  it.each(CALLS)(
    '$name appelle une commande que Rust expose, avec ses arguments',
    async (call) => {
      const { command, payload } = await lastCall(call)

      expect(sorted(Object.keys(payload).map(snakeCase))).toStrictEqual(
        sorted(parametersOfCommand(command))
      )
    }
  )

  it.each(CALLS)(
    '$name appelle une commande que lib.rs enregistre',
    async (call) => {
      const { command } = await lastCall(call)

      expect(REGISTERED_COMMANDS).toContain(command)
    }
  )

  it('n’oublie aucune commande enregistrée', async () => {
    await Promise.all(
      CALLS.map((call) => {
        return call.run()
      })
    )

    const called = invoked.map(({ command }) => {
      return command
    })

    expect(sorted(REGISTERED_COMMANDS)).toStrictEqual(sorted(called))
  })

  it('écoute les instantanés sur le canal que runtime.rs émet', async () => {
    await multifus.onSnapshot(() => {})

    expect(listenedEvent()).toBe(rustConstant(RUNTIME_SOURCE, 'SNAPSHOT_EVENT'))
  })

  it('écoute la navigation sur le canal que la barre des tâches émet', async () => {
    await multifus.onNavigate(() => {})

    expect(listenedEvent()).toBe(rustConstant(RUNTIME_SOURCE, 'NAVIGATE_EVENT'))
  })

  it('écoute la bannière sur le canal que banner.rs émet', async () => {
    await multifus.onBannerStep(() => {})

    expect(listenedEvent()).toBe(rustConstant(BANNER_SOURCE, 'STEP_EVENT'))
  })

  it('rend à la fenêtre ce que le canal porte, et rien d’autre', async () => {
    const heard: unknown[] = []

    await multifus.onSnapshot((snapshot) => {
      heard.push(snapshot)
    })

    const handler = listenedHandler()

    window.__TAURI_INTERNALS__.runCallback(handler, {
      event: 'multifus://snapshot',
      id: 1,
      payload: { version: '0.1.0' }
    })

    expect(heard).toStrictEqual([{ version: '0.1.0' }])
  })
})
