export class InvalidOrderError extends Error {
  constructor(message: string = 'Order fields failed validation') {
    super(message)
    this.name = 'INVALID_ORDER'
  }
}
