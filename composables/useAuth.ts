/**
 * Centralized auth state management.
 * All auth-related state and actions should go through this composable.
 */

export interface AuthUser {
  id: string
  email: string
  name: string
  avatar_url?: string
  role?: string
}

const TOKEN_KEY = 'token'
const USER_KEY = 'user'

const isAuthenticated = ref(false)
const currentUser = ref<AuthUser | null>(null)

// Initialize auth state lazily on first use.
// On client: reads from localStorage.
// On server: reads from cookie (set by setAuth during login).
// This runs once per environment (client/server) because module-level refs are singletons.
let initialized = false
const initAuth = () => {
  if (initialized) return
  initialized = true

  if (process.client) {
    const token = localStorage.getItem(TOKEN_KEY)
    isAuthenticated.value = !!token
    const userStr = localStorage.getItem(USER_KEY)
    if (userStr) {
      try {
        currentUser.value = JSON.parse(userStr)
      } catch {
        currentUser.value = null
      }
    }
  } else {
    const tokenCookie = useCookie(TOKEN_KEY)
    const userCookie = useCookie(USER_KEY)
    isAuthenticated.value = !!tokenCookie.value
    if (userCookie.value) {
      try {
        currentUser.value = JSON.parse(JSON.stringify(userCookie.value)) as AuthUser
      } catch {
        currentUser.value = null
      }
    }
  }
}

export const useAuth = () => {
  // Ensure auth state is initialized on first composable call
  initAuth()

  const router = useRouter()

  const setAuth = (token: string, user: AuthUser) => {
    if (process.client) {
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    }
    const tokenCookie = useCookie(TOKEN_KEY)
    const userCookie = useCookie(USER_KEY)
    tokenCookie.value = token
    userCookie.value = user
    isAuthenticated.value = true
    currentUser.value = user
  }

  const clearAuth = () => {
    if (process.client) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    }
    const tokenCookie = useCookie(TOKEN_KEY)
    const userCookie = useCookie(USER_KEY)
    tokenCookie.value = null
    userCookie.value = null
    isAuthenticated.value = false
    currentUser.value = null
  }

  const getToken = () => {
    if (process.client) {
      return localStorage.getItem(TOKEN_KEY)
    }
    return useCookie(TOKEN_KEY).value as string | null
  }

  const redirectToLogin = () => {
    clearAuth()
    router.push('/login')
  }

  const isLoggedIn = () => {
    if (process.client) {
      return !!localStorage.getItem(TOKEN_KEY)
    }
    return !!useCookie(TOKEN_KEY).value
  }

  const fetchUser = async () => {
    try {
      const token = getToken()
      if (!token) return

      const data = await $fetch('/api/v1/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (data) {
        currentUser.value = data
        setAuth(token, data)
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
    }
  }

  return {
    isAuthenticated: readonly(isAuthenticated),
    currentUser: readonly(currentUser),
    user: readonly(currentUser),
    setAuth,
    clearAuth,
    getToken,
    redirectToLogin,
    isLoggedIn,
    fetchUser,
  }
}
