import { cn } from '../cn'

const CROSS_PATH = 'M6 6 L18 18 M18 6 L6 18'

type CrossProps = Readonly<{
  className?: string
}>

export const Cross = ({ className }: CrossProps) => {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={cn('cross', className)}>
      <path d={CROSS_PATH} />
    </svg>
  )
}
