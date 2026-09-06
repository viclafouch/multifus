import { cva, type VariantProps } from 'class-variance-authority'
import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-carve tracking-wide whitespace-nowrap uppercase select-none sighted active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        leaf: 'btn-leaf',
        slate: 'btn-slate',
        bare: 'btn-bare',
        way: 'btn-way active:translate-y-0',
        glint: 'btn-glint',
        ember: 'btn-ember',
        token: 'btn-token',
        flame: 'btn-flame'
      },
      size: {
        lead: 'h-12 px-9 text-action',
        way: 'h-rung px-3.5 text-way',
        default: 'h-9 px-5 text-deed',
        sm: 'h-7 px-3.5 text-legend',
        tight: 'h-6 px-3 text-legend',
        icon: 'size-8',
        'icon-tight': 'size-6',
        'icon-pebble': 'size-pebble'
      }
    },
    defaultVariants: {
      variant: 'leaf',
      size: 'default'
    }
  }
)

export type ButtonLook = VariantProps<typeof buttonVariants>

export const Button = ({
  className,
  variant,
  size,
  ...props
}: ButtonPrimitive.Props & ButtonLook) => {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { buttonVariants }
