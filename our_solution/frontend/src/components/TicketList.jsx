import { useState, useEffect } from 'react';
import { listTickets } from '../api.js';

function formatDuration(created, closed) {
  const start = new Date(created);
  const end = closed ? new Date(closed) : new Date();
  const diffMs = end - start;
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }
  
  if (hours > 0) {
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  
  const minutes = Math.floor(diffMs / (1000 * 60));
  return `${minutes}m`;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TicketList({ onSelectTicket, onBackToDiagnose }) {
  const [activeTab, setActiveTab] = useState('active');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTickets();
  }, [activeTab]);

  const loadTickets = async () => {
    setLoading(true);
    setError('');
    try {
      const fetchedTickets = await listTickets(activeTab);
      setTickets(fetchedTickets);
    } catch (err) {
      setError(err.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tickets-container">
      <div className="tickets-header">
        <button onClick={onBackToDiagnose} className="back-button">
          ← Back to Diagnostics
        </button>
        <h1>Ticket Management</h1>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active Tickets
        </button>
        <button
          className={`tab ${activeTab === 'closed' ? 'active' : ''}`}
          onClick={() => setActiveTab('closed')}
        >
          Closed Tickets
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>Loading tickets...</p>
      ) : tickets.length === 0 ? (
        <p className="no-tickets">
          No {activeTab} tickets found. {activeTab === 'active' && 'Create a ticket from a diagnosis!'}
        </p>
      ) : (
        <div className="ticket-list">
          {tickets.map((ticket) => {
            const parsedData = ticket.diagnosis_data?.parsed || {};
            const alertSummary = ticket.alert_text.split('\n')[0].substring(0, 80);
            
            return (
              <div
                key={ticket.id}
                className="ticket-card"
                onClick={() => onSelectTicket(ticket.id)}
              >
                <div className="ticket-card-header">
                  <span className="ticket-id">#{ticket.ticket_number || ticket.id}</span>
                  <span className={`status-badge ${ticket.status}`}>
                    {ticket.status}
                  </span>
                </div>

                <div className="ticket-summary">
                  {alertSummary}...
                </div>

                <div className="ticket-meta">
                  {parsedData.ticket_id && (
                    <span className="meta-item">
                      🎫 {parsedData.ticket_id}
                    </span>
                  )}
                  {parsedData.module && (
                    <span className="meta-item">
                      📦 {parsedData.module}
                    </span>
                  )}
                  {parsedData.channel && (
                    <span className="meta-item">
                      {parsedData.channel === 'Email' ? '📧' : parsedData.channel === 'SMS' ? '📱' : '📞'} {parsedData.channel}
                    </span>
                  )}
                </div>

                <div className="ticket-footer">
                  <span className="ticket-time">
                    {ticket.status === 'active' ? (
                      <>⏱ Open for {formatDuration(ticket.created_at, null)}</>
                    ) : (
                      <>✓ Resolved in {formatDuration(ticket.created_at, ticket.closed_at)}</>
                    )}
                  </span>
                  <span className="ticket-date">
                    {formatDate(ticket.created_at)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

