export interface UserRow {
  id: string
  email: string

  scopes: string
  subscription?: string
  created_ms: string
  refresh_token?: string
}

export interface UnsubedMessageRow {
  user: string
  message_id: string
  created_ms: number
}
