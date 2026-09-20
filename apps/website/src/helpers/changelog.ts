export type ChangelogSection = Readonly<{
  title: string
  lines: readonly string[]
}>

export type ChangelogRelease = Readonly<{
  version: string
  day: string | null
  sections: readonly ChangelogSection[]
}>

const RELEASE_HEADING =
  /^\[?(?<version>[^\]\s]+)\]?(?:\s+[-–—]\s+(?<day>\d{4}-\d{2}-\d{2}))?$/u

const repeated = (values: readonly string[]) => {
  const seen = new Set<string>()

  return values.find((value) => {
    return seen.size === seen.add(value).size
  })
}

const headingOf = (block: string) => {
  const [heading = '', ...rest] = block.split('\n')

  return { heading: heading.trim(), body: rest.join('\n') }
}

const linesOf = (body: string) => {
  return body
    .split('\n')
    .map((line) => {
      return line.trim()
    })
    .filter((line) => {
      return line.startsWith('- ')
    })
    .map((line) => {
      return line.slice(2).trim()
    })
}

const sectionsOf = (body: string, version: string) => {
  const sections = body
    .split(/^### /mu)
    .slice(1)
    .map((block) => {
      const { heading, body: rest } = headingOf(block)
      const lines = linesOf(rest)

      if (heading === '' || lines.length === 0) {
        throw new Error(
          `changelog: section "${heading}" of version ${version} says nothing`
        )
      }

      const twice = repeated(lines)

      if (twice !== undefined) {
        throw new Error(
          `changelog: version ${version} says "${twice}" twice under "${heading}"`
        )
      }

      return { title: heading, lines }
    })

  const twice = repeated(
    sections.map(({ title }) => {
      return title
    })
  )

  if (twice !== undefined) {
    throw new Error(`changelog: version ${version} opens "${twice}" twice`)
  }

  return sections
}

export const releasesOf = (changelog: string): readonly ChangelogRelease[] => {
  const releases = changelog
    .split(/^## /mu)
    .slice(1)
    .map((block) => {
      const { heading, body } = headingOf(block)
      const named: Partial<Record<string, string>> =
        RELEASE_HEADING.exec(heading)?.groups ?? {}

      if (named.version === undefined) {
        throw new Error(`changelog: "${heading}" is not a version heading`)
      }

      const sections = sectionsOf(body, named.version)

      if (sections.length === 0) {
        throw new Error(`changelog: version ${named.version} has no section`)
      }

      return { version: named.version, day: named.day ?? null, sections }
    })

  const twice = repeated(
    releases.map(({ version }) => {
      return version
    })
  )

  if (twice !== undefined) {
    throw new Error(`changelog: version ${twice} is written twice`)
  }

  return releases
}
