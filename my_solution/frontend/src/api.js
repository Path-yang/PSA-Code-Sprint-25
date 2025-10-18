const explicitBase = import.meta.env.VITE_API_BASE_URL;
const DEFAULT_BASE_URL = explicitBase && explicitBase.length > 0 ? explicitBase.replace(/\/+$/, '') : '';

export async function diagnoseAlert(alertText) {
  const endpoint = DEFAULT_BASE_URL ? `${DEFAULT_BASE_URL}/api/diagnose` : '/api/diagnose';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ alertText }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = payload.error || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}
