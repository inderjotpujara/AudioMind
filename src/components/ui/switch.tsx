import { Switch as HeadlessSwitch } from '@headlessui/react'
import { cn } from '@/lib/utils'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  className
}: SwitchProps) {
  const sizeClasses = {
    sm: {
      switch: 'h-4 w-7',
      thumb: 'h-3 w-3',
      translate: 'translate-x-3'
    },
    md: {
      switch: 'h-6 w-11',
      thumb: 'h-5 w-5',
      translate: 'translate-x-5'
    },
    lg: {
      switch: 'h-7 w-12',
      thumb: 'h-6 w-6',
      translate: 'translate-x-5'
    }
  }

  const sizes = sizeClasses[size]

  return (
    <HeadlessSwitch.Group as="div" className={cn('flex items-center', className)}>
      <HeadlessSwitch
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={cn(
          'relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          sizes.switch,
          {
            'bg-blue-600': checked && !disabled,
            'bg-gray-200 dark:bg-gray-600': !checked && !disabled,
            'opacity-50 cursor-not-allowed': disabled
          }
        )}
      >
        <span className="sr-only">{label || 'Toggle switch'}</span>
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none inline-block rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out',
            sizes.thumb,
            {
              [sizes.translate]: checked,
              'translate-x-0': !checked
            }
          )}
        />
      </HeadlessSwitch>
      
      {(label || description) && (
        <HeadlessSwitch.Label as="div" className="ml-3 cursor-pointer">
          {label && (
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {label}
            </div>
          )}
          {description && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {description}
            </div>
          )}
        </HeadlessSwitch.Label>
      )}
    </HeadlessSwitch.Group>
  )
}
