import { Tab } from '@headlessui/react'
import { cn } from '@/lib/utils'

interface TabItem {
  label: string
  content: React.ReactNode
  icon?: React.ReactNode
  disabled?: boolean
}

interface TabsProps {
  tabs: TabItem[]
  defaultIndex?: number
  onChange?: (index: number) => void
  variant?: 'default' | 'pills' | 'underline'
  className?: string
}

export function Tabs({
  tabs,
  defaultIndex = 0,
  onChange,
  variant = 'default',
  className
}: TabsProps) {
  return (
    <Tab.Group defaultIndex={defaultIndex} {...(onChange && { onChange })}>
      <Tab.List
        className={cn(
          'flex space-x-1',
          {
            'rounded-xl bg-gray-100 p-1 dark:bg-gray-800': variant === 'default',
            'space-x-2': variant === 'pills',
            'border-b border-gray-200 dark:border-gray-700': variant === 'underline'
          },
          className
        )}
      >
        {tabs.map((tab, index) => (
          <Tab
            key={index}
            disabled={tab.disabled || false}
            className={({ selected }) =>
              cn(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                {
                  // Default variant
                  'text-blue-700 bg-white shadow dark:text-blue-100 dark:bg-gray-700':
                    selected && variant === 'default',
                  'text-gray-700 hover:bg-white/[0.12] hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100':
                    !selected && variant === 'default',

                  // Pills variant
                  'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100':
                    selected && variant === 'pills',
                  'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100':
                    !selected && variant === 'pills',

                  // Underline variant
                  'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400':
                    selected && variant === 'underline',
                  'border-b-2 border-transparent text-gray-700 hover:text-gray-900 hover:border-gray-300 dark:text-gray-300 dark:hover:text-gray-100':
                    !selected && variant === 'underline',

                  'opacity-50 cursor-not-allowed': tab.disabled
                }
              )
            }
          >
            <div className="flex items-center justify-center space-x-2">
              {tab.icon && <div className="h-4 w-4">{tab.icon}</div>}
              <span>{tab.label}</span>
            </div>
          </Tab>
        ))}
      </Tab.List>
      
      <Tab.Panels className="mt-4">
        {tabs.map((tab, index) => (
          <Tab.Panel
            key={index}
            className="rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {tab.content}
          </Tab.Panel>
        ))}
      </Tab.Panels>
    </Tab.Group>
  )
}
