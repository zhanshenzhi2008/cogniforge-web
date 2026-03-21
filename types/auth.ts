export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: string
  createdAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface RegisterResponse {
  Token: string
  User: User
}
