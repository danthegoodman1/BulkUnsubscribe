export interface UserRow {
  id: string
  email: string

  increased_scopes: boolean
  subscription?: string
  created_ms: string
  refresh_token?: string
}
