export interface UserRow {
  id: string
  email: string

  scopes: string
  subscription?: string
  created_ms: string
  refresh_token?: string
}
