/**
 * Type-safe helper to detect 404s
 */
export function isNotFoundError(error: unknown): error is { status: number } {
	return (
		typeof error === 'object' &&
		error !== null &&
		'status' in error &&
		(error as any).status === 404
	);
}
