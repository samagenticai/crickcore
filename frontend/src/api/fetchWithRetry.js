const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isRetryableError(error) {
  if (!error) return false;
  if (error.code === "ERR_CANCELED") return false;
  if (error.code === "ECONNABORTED") return true;
  const status = error.status ?? error.response?.status;
  if (status === undefined && !error.response) return true;
  return status === 408 || status === 429 || status >= 500;
}

/**
 * Retry transient network/server failures. Never retries cancelled requests.
 */
export async function fetchWithRetry(factory, { retries = 2, baseDelayMs = 400 } = {}) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await factory();
    } catch (error) {
      lastError = error;
      if (error?.code === "ERR_CANCELED") throw error;
      if (attempt >= retries || !isRetryableError(error)) throw error;
      await sleep(baseDelayMs * (attempt + 1));
    }
  }

  throw lastError;
}
