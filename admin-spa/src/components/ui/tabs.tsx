import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

export const Tabs = TabsPrimitive.Root

export const TabsList = React.forwardRef<React.ElementRef<typeof TabsPrimitive.List>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>>(
  ({ className, ...props }, ref) => (
    <TabsPrimitive.List ref={ref} className={cn('inline-flex h-9 items-center gap-1 border-b border-border w-full', className)} {...props} />
  )
)
TabsList.displayName = 'TabsList'

export const TabsTrigger = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Trigger>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>>(
  ({ className, ...props }, ref) => (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'inline-flex items-center px-3 h-9 text-sm font-medium text-ink-muted border-b-2 border-transparent -mb-px hover:text-ink data-[state=active]:text-ink data-[state=active]:border-brand transition-colors',
        className
      )}
      {...props}
    />
  )
)
TabsTrigger.displayName = 'TabsTrigger'

export const TabsContent = TabsPrimitive.Content
