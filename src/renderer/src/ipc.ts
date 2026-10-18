import type { ApiPreload } from '../../preload/index'

declare global {
  interface Window {
    api: ApiPreload
  }
}

export function api(): ApiPreload {
  return window.api
}
