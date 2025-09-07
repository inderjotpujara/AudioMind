import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

// jest-dom matchers are automatically extended when importing '@testing-library/jest-dom'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  root = null
  rootMargin = ''
  thresholds: number[] = []
  
  constructor() {}
  observe() {
    return null
  }
  disconnect() {
    return null
  }
  unobserve() {
    return null
  }
  takeRecords() {
    return []
  }
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null
  }
  disconnect() {
    return null
  }
  unobserve() {
    return null
  }
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})

// Mock localStorage
const localStorageMock = {
  length: 0,
  getItem: (_key: string) => null,
  setItem: (_key: string, _value: string) => null,
  removeItem: (_key: string) => null,
  clear: () => null,
  key: (_index: number) => null,
}
global.localStorage = localStorageMock as Storage

// Mock sessionStorage
const sessionStorageMock = {
  length: 0,
  getItem: (_key: string) => null,
  setItem: (_key: string, _value: string) => null,
  removeItem: (_key: string) => null,
  clear: () => null,
  key: (_index: number) => null,
}
global.sessionStorage = sessionStorageMock as Storage

// Mock URL.createObjectURL
global.URL.createObjectURL = () => 'mocked-url'
global.URL.revokeObjectURL = () => {}

// Mock fetch if not available
if (!global.fetch) {
  global.fetch = () =>
    Promise.resolve({
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
      ok: true,
      status: 200,
      statusText: 'OK',
    } as Response)
}
