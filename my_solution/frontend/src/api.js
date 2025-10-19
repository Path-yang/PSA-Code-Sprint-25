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

// ============================================================================
// Ticket Management API
// ============================================================================

export async function createTicket(alertText, diagnosis) {
  const endpoint = DEFAULT_BASE_URL ? `${DEFAULT_BASE_URL}/api/tickets` : '/api/tickets';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ alertText, diagnosis }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = payload.error || `Failed to create ticket: ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}

export async function listTickets(status = null) {
  let endpoint = DEFAULT_BASE_URL ? `${DEFAULT_BASE_URL}/api/tickets` : '/api/tickets';
  if (status) {
    endpoint += `?status=${status}`;
  }

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch tickets: ${response.status}`);
  }

  return response.json();
}

export async function getTicket(ticketId) {
  const endpoint = DEFAULT_BASE_URL 
    ? `${DEFAULT_BASE_URL}/api/tickets/${ticketId}` 
    : `/api/tickets/${ticketId}`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = payload.error || `Failed to fetch ticket: ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}

export async function updateTicket(ticketId, updates) {
  const endpoint = DEFAULT_BASE_URL 
    ? `${DEFAULT_BASE_URL}/api/tickets/${ticketId}` 
    : `/api/tickets/${ticketId}`;

  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = payload.error || `Failed to update ticket: ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}

export async function closeTicket(ticketId) {
  const endpoint = DEFAULT_BASE_URL 
    ? `${DEFAULT_BASE_URL}/api/tickets/${ticketId}/close` 
    : `/api/tickets/${ticketId}/close`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = payload.error || `Failed to close ticket: ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}

export async function deleteTicket(ticketId) {
  const endpoint = DEFAULT_BASE_URL 
    ? `${DEFAULT_BASE_URL}/api/tickets/${ticketId}` 
    : `/api/tickets/${ticketId}`;

  const response = await fetch(endpoint, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = payload.error || `Failed to delete ticket: ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}
