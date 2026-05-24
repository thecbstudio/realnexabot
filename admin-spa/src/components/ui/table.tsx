import * as React from 'react'
import { cn } from '@/lib/utils'

export const Table = ({ className, ...p }: React.HTMLAttributes<HTMLTableElement>) => (
  <table className={cn('w-full text-sm', className)} {...p} />
)
export const THead = ({ className, ...p }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={cn('text-xs uppercase tracking-wide text-ink-muted border-b border-border', className)} {...p} />
)
export const TBody = ({ className, ...p }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={cn('divide-y divide-border', className)} {...p} />
)
export const TR = ({ className, ...p }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cn('hover:bg-bg transition-colors', className)} {...p} />
)
export const TH = ({ className, ...p }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th className={cn('text-left font-medium px-4 py-2.5', className)} {...p} />
)
export const TD = ({ className, ...p }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={cn('px-4 py-3 text-ink', className)} {...p} />
)
