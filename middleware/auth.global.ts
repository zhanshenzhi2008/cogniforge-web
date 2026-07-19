/**
 * Route middleware: redirect to login if user is not authenticated.
 * Applied globally via nuxt.config.
 */
export default defineNuxtRouteMiddleware((to) => {
  const { isLoggedIn, isAuthenticated } = useAuth()
  const isAuthPage = to.path === '/login' || to.path === '/register'

  // Server side: use cookie-based auth state (setAuth writes to cookies too)
  if (process.server) {
    console.log('[Auth Middleware] Server side, path:', to.path, 'isAuthenticated:', isAuthenticated.value)
    if (!isAuthenticated.value) {
      if (!isAuthPage) {
        return navigateTo('/login')
      }
    } else {
      if (isAuthPage) {
        return navigateTo('/')
      }
    }
    return
  }

  // Client side: use localStorage-based auth state
  if (!isLoggedIn()) {
    if (!isAuthPage) {
      return navigateTo('/login')
    }
  } else {
    if (isAuthPage) {
      return navigateTo('/')
    }
  }
})
