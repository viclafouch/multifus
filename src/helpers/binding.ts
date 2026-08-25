import type { Binding } from '@/@types/shortcuts'

export const matchIsSameBinding = (binding: Binding | null, other: Binding) => {
  if (binding === null) {
    return false
  }

  if (binding.kind === 'action' && other.kind === 'action') {
    return binding.action === other.action
  }

  if (binding.kind === 'quickReply' && other.kind === 'quickReply') {
    return binding.id === other.id
  }

  return false
}
