export class ApiError extends Error {
	constructor(
		public statusCode: number,
		public message: string,
		public code?: string,
	) {
		super(message);
		this.name = "ApiError";
		Error.captureStackTrace(this, this.constructor);
	}
}

export class ValidationError extends ApiError {
	constructor(
		message: string,
		public field?: string,
	) {
		super(400, message, "VALIDATION_ERROR");
	}
}

export class AuthenticationError extends ApiError {
	constructor(message = "Authentication required") {
		super(401, message, "AUTHENTICATION_ERROR");
	}
}

export class AuthorizationError extends ApiError {
	constructor(message = "Insufficient permissions") {
		super(403, message, "AUTHORIZATION_ERROR");
	}
}

export class NotFoundError extends ApiError {
	constructor(resource = "Resource") {
		super(404, `${resource} not found`, "NOT_FOUND_ERROR");
	}
}

export class ConflictError extends ApiError {
	constructor(message: string) {
		super(409, message, "CONFLICT_ERROR");
	}
}

export class TooManyRequestsError extends ApiError {
	constructor(message = "Too many requests") {
		super(429, message, "RATE_LIMIT_ERROR");
	}
}

export class InternalServerError extends ApiError {
	constructor(message = "Internal server error") {
		super(500, message, "INTERNAL_SERVER_ERROR");
	}
}
