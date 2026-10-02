import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

class IntersectionObserverMock {
  constructor(callback) {
    this.callback = callback
  }

  observe(target) {
    this.callback([{ isIntersecting: true, target, time: Date.now() }], this)
  }

  unobserve() {}

  disconnect() {}

  takeRecords() {
    return []
  }
}

window.IntersectionObserver = IntersectionObserverMock

window.matchMedia = vi.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))

window.scrollTo = vi.fn()

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  cleanup()
})
