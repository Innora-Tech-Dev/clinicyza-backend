/**
 * Throw this anywhere in a route/service; the handler wrapper turns it into
 *   { success: false, error: { code, message, details } } with the right status.
 */
export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message = "Bad request", code = "BAD_REQUEST", details) {
    return new ApiError(400, code, message, details);
  }
  static unauthorized(message = "Authentication required", code = "UNAUTHORIZED") {
    return new ApiError(401, code, message);
  }
  static forbidden(message = "You don't have access to this resource", code = "FORBIDDEN") {
    return new ApiError(403, code, message);
  }
  static notFound(message = "Not found", code = "NOT_FOUND") {
    return new ApiError(404, code, message);
  }
  static validation(details, message = "Some fields are invalid") {
    return new ApiError(422, "VALIDATION_ERROR", message, details);
  }
}
