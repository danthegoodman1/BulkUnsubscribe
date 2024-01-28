import {
  randomUUID,
  randomBytes,
  createCipheriv,
  createDecipheriv,
} from "crypto"

export function encrypt(text: string, key: string) {
  key = key.slice(0, 32)
  const iv = randomBytes(16)
  let cipher = createCipheriv("aes-256-cbc", Buffer.from(key), iv)
  let encrypted = cipher.update(text)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  return iv.toString("hex") + encrypted.toString("hex")
}

export function decrypt(text: string, key: string) {
  key = key.slice(0, 32)
  let iv = Buffer.from(text.slice(0, 32), "hex") // 32 since hex
  let encryptedText = Buffer.from(text.slice(32), "hex")
  let decipher = createDecipheriv("aes-256-cbc", Buffer.from(key), iv)
  let decrypted = decipher.update(encryptedText)
  decrypted = Buffer.concat([decrypted, decipher.final()])
  return decrypted.toString()
}

export function isAdminEmail(email: string) {
  return (process.env.ADMIN_EMAILS ?? "").split(",").includes(email)
}
