/**
 * Thrown by a use case for something the caller must never do, such as an
 * actor acting without permission. Expected outcomes (a wrong code, a rate
 * limit) are returned as results instead. Edges map `code` to a message.
 */
export class DomainError extends Error {
  readonly code: "forbidden";

  constructor(code: "forbidden", message: string) {
    super(message);
    this.name = "DomainError";
    this.code = code;
  }
}
