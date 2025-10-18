const DEFAULT_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export async function diagnoseAlert(alertText) {
  const response = await fetch(`${DEFAULT_BASE_URL}/api/diagnose`, {
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
