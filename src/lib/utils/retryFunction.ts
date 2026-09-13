export async function fetchWithRetry<T>(
    fn: () => Promise<T>,
    retries = 3,
    delay = 800
): Promise<T> {
    try {
        return await fn();
    } catch (err) {
        if (retries <= 0) throw err;
        await new Promise((r) => setTimeout(r, delay));
        return fetchWithRetry(fn, retries - 1, delay * 1.5); // slight backoff
    }
}