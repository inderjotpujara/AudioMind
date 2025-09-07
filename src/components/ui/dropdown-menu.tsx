import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { cn } from '@/lib/utils'

interface DropdownMenuItem {
  label: string
  onClick: () => void
  icon?: React.ReactNode
  disabled?: boolean
  destructive?: boolean
}

interface DropdownMenuProps {
  trigger: React.ReactNode
  items: DropdownMenuItem[]
  align?: 'left' | 'right'
  className?: string
}

export function DropdownMenu({ trigger, items, align = 'right', className }: DropdownMenuProps) {
  return (
    <Menu as="div" className={cn('relative inline-block text-left', className)}>
      <div>
        <Menu.Button as="div" className="cursor-pointer">
          {trigger}
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className={cn(
            'absolute z-10 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800 dark:divide-gray-700',
            {
              'right-0': align === 'right',
              'left-0': align === 'left'
            }
          )}
        >
          <div className="py-1">
            {items.map((item, index) => (
              <Menu.Item key={index} disabled={item.disabled || false}>
                {({ active }) => (
                  <button
                    onClick={item.onClick}
                    disabled={item.disabled}
                    className={cn(
                      'group flex w-full items-center px-4 py-2 text-sm transition-colors',
                      {
                        'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white': active && !item.destructive,
                        'bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100': active && item.destructive,
                        'text-gray-700 dark:text-gray-300': !active && !item.destructive,
                        'text-red-700 dark:text-red-400': !active && item.destructive,
                        'opacity-50 cursor-not-allowed': item.disabled
                      }
                    )}
                  >
                    {item.icon && (
                      <div className="mr-3 h-4 w-4 flex-shrink-0">
                        {item.icon}
                      </div>
                    )}
                    {item.label}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
