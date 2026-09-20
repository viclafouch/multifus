import { describe, expect, it } from 'vitest'
import { releasesOf } from '@/helpers/changelog'

const CHANGELOG = `# Journal des versions

## 0.2.0 - 2026-10-05

### Ajouté

- Une chose neuve.
- Une autre chose neuve.

### Corrigé

- Un défaut parti.

## 0.1.0

### Ajouté

- La première version.
`

describe('releasesOf', () => {
  it('reads the versions from the newest to the oldest, as they are written', () => {
    const releases = releasesOf(CHANGELOG)

    expect(
      releases.map(({ version }) => {
        return version
      })
    ).toStrictEqual(['0.2.0', '0.1.0'])
  })

  it('takes the day when the heading carries one, and nothing when it does not', () => {
    const [newest, oldest] = releasesOf(CHANGELOG)

    expect(newest.day).toBe('2026-10-05')
    expect(oldest.day).toBeNull()
  })

  it('keeps the sections in their order, with their lines', () => {
    const [newest] = releasesOf(CHANGELOG)

    expect(newest.sections).toStrictEqual([
      {
        title: 'Ajouté',
        lines: ['Une chose neuve.', 'Une autre chose neuve.']
      },
      { title: 'Corrigé', lines: ['Un défaut parti.'] }
    ])
  })

  it('reads the heading that Keep a Changelog writes, brackets and long dash alike', () => {
    const [only] = releasesOf(
      '## [1.2.3] — 2026-11-02\n\n### Ajouté\n\n- Rien.'
    )

    expect(only.version).toBe('1.2.3')
    expect(only.day).toBe('2026-11-02')
  })

  it('leaves out the title of the file, which is not a version', () => {
    expect(releasesOf('# Journal des versions\n')).toStrictEqual([])
  })

  it('answers on an empty file rather than failing', () => {
    expect(releasesOf('')).toStrictEqual([])
  })

  it('fails on a heading it cannot read, rather than dropping the version', () => {
    expect(() => {
      return releasesOf('## Version 0.1.0\n\n### Ajouté\n\n- Rien.')
    }).toThrow('is not a version heading')
  })

  it('fails on a version that carries no section', () => {
    expect(() => {
      return releasesOf('## 0.1.0\n\nRien à dire.')
    }).toThrow('has no section')
  })

  it('fails on a section that carries no line', () => {
    expect(() => {
      return releasesOf('## 0.1.0\n\n### Ajouté\n')
    }).toThrow('says nothing')
  })

  it('fails on a line written twice under the same section', () => {
    expect(() => {
      return releasesOf('## 0.1.0\n\n### Ajouté\n\n- Rien.\n- Rien.')
    }).toThrow('twice under')
  })

  it('fails on a section opened twice in the same version', () => {
    expect(() => {
      return releasesOf(
        '## 0.1.0\n\n### Ajouté\n\n- Rien.\n\n### Ajouté\n\n- Rien du tout.'
      )
    }).toThrow('opens "Ajouté" twice')
  })

  it('fails on a version written twice', () => {
    expect(() => {
      return releasesOf(
        '## 0.1.0\n\n### Ajouté\n\n- Rien.\n\n## 0.1.0\n\n### Ajouté\n\n- Rien du tout.'
      )
    }).toThrow('is written twice')
  })

  it('reads the three changelogs of the repository', () => {
    for (const changelog of Object.values(__CHANGELOG__)) {
      expect(() => {
        return releasesOf(changelog)
      }).not.toThrow()
    }
  })
})
