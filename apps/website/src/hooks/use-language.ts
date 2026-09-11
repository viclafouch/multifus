import { useRouterState } from '@tanstack/react-router'
import { languageOf } from '@/helpers/language'

export const useLanguage = () => {
  const pathname = useRouterState({
    select: (state) => {
      return state.location.pathname
    }
  })

  return languageOf(pathname)
}
