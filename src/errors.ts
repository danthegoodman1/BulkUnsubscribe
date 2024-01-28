export class HighStatusCode extends Error {
  constructor(code: number, text: string) {
    super(`High status code(${code}): ${text}`)

    // capturing the stack trace keeps the reference to your error class
    // Error.captureStackTrace(this, this.constructor); // THIS BREAKS BUN
  }
}
