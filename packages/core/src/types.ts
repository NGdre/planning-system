export type Result<T, E = string> = { success: true; value: T } | { success: false; error: E }

export type VoidResult<E = string> = { success: true } | { success: false; error: E }
