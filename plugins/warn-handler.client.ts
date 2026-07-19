/**
 * Suppress known Naive UI slot warnings that arise in Vue 3.5+ dev mode.
 *
 * Naive UI internally calls slot functions during component setup (e.g. in
 * Popover/Dropdown trigger resolution) rather than inside the render function.
 * Vue 3.5 added a stricter warning for this pattern, which is a known
 * limitation of the library — there is no fix on the user side.
 *
 * We only suppress the exact warning strings produced by naive-ui internals,
 * so any other genuine Vue warnings are still surfaced normally.
 */
export default defineNuxtPlugin((nuxtApp) => {
  if (process.env.NODE_ENV !== 'development') return

  nuxtApp.vueApp.config.warnHandler = (msg, _instance, _trace) => {
    // Vue 3.5+ warns when a slot is called during component setup rather than
    // inside the render function. Naive UI's Popover/Dropdown do this internally
    // (trigger-slot resolution), which is a known limitation of the library.
    // We suppress this exact pattern while still surfacing all other warnings.
    if (msg.includes('invoked outside of the render function')) return
    console.warn('[Vue warn]', msg)
  }
})
