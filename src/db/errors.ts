export class RowsNotFound extends Error {
  constructor () {
    super("rows not found")

    // capturing the stack trace keeps the reference to your error class
    // Error.captureStackTrace(this, this.constructor); // THIS BREAKS BUN
  }
}
