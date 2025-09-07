import { cn } from '@/lib/utils'

interface ProgressProps {
  value: number
  max?: number
  className?: string
  showValue?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3'
}

export function Progress({ 
  value, 
  max = 100, 
  className, 
  showValue = false,
  size = 'md'
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className="w-full">
      <div className={cn(
        'w-full bg-gray-200 rounded-full dark:bg-gray-700',
        sizeClasses[size],
        className
      )}>
        <div
          className={cn(
            'bg-blue-600 rounded-full transition-all duration-300 ease-out',
            sizeClasses[size]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showValue && (
        <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 text-right">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  )
}
