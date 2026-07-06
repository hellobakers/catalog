export class UnauthorizedError extends Error {
  constructor(message = "You are not authorized to perform this action") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class NotFoundError extends Error {
  constructor(message = "Resource not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return { error: "Unauthorized access", status: 403 };
  }
  if (error instanceof NotFoundError) {
    return { error: "Not found", status: 404 };
  }
  console.error("API Error:", error);
  return { error: "Internal server error", status: 500 };
}
