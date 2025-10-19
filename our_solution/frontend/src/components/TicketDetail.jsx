import { useState, useEffect } from 'react';
import { getTicket, updateTicket, closeTicket, deleteTicket } from '../api.js';

function formatDateTime(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TicketDetail({ ticketId, onBack, onTicketUpdated }) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Editable fields
  const [editedRootCause, setEditedRootCause] = useState('');
  const [editedTechnicalDetails, setEditedTechnicalDetails] = useState('');
  const [editedResolutionSteps, setEditedResolutionSteps] = useState('');
  const [notes, setNotes] = useState('');
  const [customFields, setCustomFields] = useState({});
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');

  useEffect(() => {
    loadTicket();
  }, [ticketId]);

  const loadTicket = async () => {
    setLoading(true);
    setError('');
    try {
      const fetchedTicket = await getTicket(ticketId);
      setTicket(fetchedTicket);
      
      // Initialize edit fields
      const diagnosis = fetchedTicket.edited_diagnosis || fetchedTicket.diagnosis_data;
      setEditedRootCause(diagnosis.rootCause?.root_cause || '');
      setEditedTechnicalDetails(diagnosis.rootCause?.technical_details || '');
      setEditedResolutionSteps(
        Array.isArray(diagnosis.resolution?.resolution_steps)
          ? diagnosis.resolution.resolution_steps.join('\n')
          : ''
      );
      setNotes(fetchedTicket.notes || '');
      setCustomFields(fetchedTicket.custom_fields || {});
    } catch (err) {
      setError(err.message || 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const diagnosis = ticket.edited_diagnosis || ticket.diagnosis_data;
      
      const editedDiagnosis = {
        ...diagnosis,
        rootCause: {
          ...diagnosis.rootCause,
          root_cause: editedRootCause,
          technical_details: editedTechnicalDetails,
        },
        resolution: {
          ...diagnosis.resolution,
          resolution_steps: editedResolutionSteps.split('\n').filter(s => s.trim()),
        },
      };

      const updated = await updateTicket(ticketId, {
        edited_diagnosis: editedDiagnosis,
        notes,
        custom_fields: customFields,
      });

      setTicket(updated);
      setIsEditing(false);
      if (onTicketUpdated) onTicketUpdated();
    } catch (err) {
      setError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async () => {
    if (!confirm('Close this ticket? This will mark it as resolved.')) return;
    
    setSaving(true);
    setError('');
    try {
      await closeTicket(ticketId);
      if (onTicketUpdated) onTicketUpdated();
      onBack();
    } catch (err) {
      setError(err.message || 'Failed to close ticket');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this ticket permanently? This cannot be undone.')) return;
    
    setSaving(true);
    setError('');
    try {
      await deleteTicket(ticketId);
      if (onTicketUpdated) onTicketUpdated();
      onBack();
    } catch (err) {
      setError(err.message || 'Failed to delete ticket');
      setSaving(false);
    }
  };

  const addCustomField = () => {
    if (newFieldKey.trim() && newFieldValue.trim()) {
      setCustomFields({ ...customFields, [newFieldKey.trim()]: newFieldValue.trim() });
      setNewFieldKey('');
      setNewFieldValue('');
    }
  };

  const removeCustomField = (key) => {
    const updated = { ...customFields };
    delete updated[key];
    setCustomFields(updated);
  };

  if (loading) {
    return (
      <div className="ticket-detail">
        <button onClick={onBack} className="back-button">← Back to List</button>
        <div className="loading">Loading ticket...</div>
      </div>
    );
  }
  
  if (error && !ticket) {
    return (
      <div className="ticket-detail">
        <button onClick={onBack} className="back-button">← Back to List</button>
        <div className="error">
          <h2>Error Loading Ticket</h2>
          <p>{error}</p>
          <p>This ticket may have been deleted or there was a database error.</p>
        </div>
      </div>
    );
  }
  
  if (!ticket) {
    return (
      <div className="ticket-detail">
        <button onClick={onBack} className="back-button">← Back to List</button>
        <div className="error">Ticket not found</div>
      </div>
    );
  }

  const displayData = ticket.edited_diagnosis || ticket.diagnosis_data;
  const parsed = displayData.parsed || {};
  const rootCause = displayData.rootCause || {};
  const resolution = displayData.resolution || {};

  return (
    <div className="ticket-detail">
      <div className="ticket-detail-header">
        <button onClick={onBack} className="back-button">
          ← Back to List
        </button>
        <div className="ticket-title">
          <h1>Ticket #{ticket.ticket_number || ticket.id}</h1>
          <span className={`status-badge ${ticket.status}`}>{ticket.status}</span>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {/* Ticket Info */}
      <section className="card">
        <h2>Ticket Information</h2>
        <div className="info-grid">
          <div className="info-item">
            <strong>Created:</strong> {formatDateTime(ticket.created_at)}
          </div>
          <div className="info-item">
            <strong>Last Updated:</strong> {formatDateTime(ticket.updated_at)}
          </div>
          {ticket.closed_at && (
            <div className="info-item">
              <strong>Closed:</strong> {formatDateTime(ticket.closed_at)}
            </div>
          )}
        </div>
      </section>

      {/* Alert Text */}
      <section className="card">
        <h2>Original Alert</h2>
        <pre className="alert-text">{ticket.alert_text}</pre>
      </section>

      {/* Parsed Info */}
      {parsed && Object.keys(parsed).length > 0 && (
        <section className="card">
          <h2>Parsed Information</h2>
          <div className="info-grid">
            {parsed.ticket_id && <div className="info-item"><strong>Ticket ID:</strong> {parsed.ticket_id}</div>}
            {parsed.module && <div className="info-item"><strong>Module:</strong> {parsed.module}</div>}
            {parsed.entity_id && <div className="info-item"><strong>Entity:</strong> {parsed.entity_id}</div>}
            {parsed.channel && <div className="info-item"><strong>Channel:</strong> {parsed.channel}</div>}
            {parsed.priority && <div className="info-item"><strong>Priority:</strong> {parsed.priority}</div>}
          </div>
        </section>
      )}

      {/* Root Cause */}
      <section className="card">
        <div className="section-header">
          <h2>Root Cause Analysis</h2>
          {!isEditing && ticket.status === 'active' && (
            <button onClick={() => setIsEditing(true)} className="edit-button">
              Edit
            </button>
          )}
        </div>
        {isEditing ? (
          <>
            <label htmlFor="root-cause">Root Cause</label>
            <textarea
              id="root-cause"
              value={editedRootCause}
              onChange={(e) => setEditedRootCause(e.target.value)}
            />
            <label htmlFor="technical-details">Technical Details</label>
            <textarea
              id="technical-details"
              value={editedTechnicalDetails}
              onChange={(e) => setEditedTechnicalDetails(e.target.value)}
            />
          </>
        ) : (
          <>
            <p><strong>Root Cause:</strong> {rootCause.root_cause}</p>
            <p className="muted">{rootCause.technical_details}</p>
            {rootCause.confidence && <p><strong>Confidence:</strong> {rootCause.confidence}%</p>}
          </>
        )}
      </section>

      {/* Resolution */}
      <section className="card">
        <h2>Resolution Plan</h2>
        {isEditing ? (
          <>
            <label htmlFor="resolution-steps">Resolution Steps (one per line)</label>
            <textarea
              id="resolution-steps"
              value={editedResolutionSteps}
              onChange={(e) => setEditedResolutionSteps(e.target.value)}
              rows="6"
            />
          </>
        ) : (
          <>
            {resolution.estimated_time && <p><strong>Estimated Time:</strong> {resolution.estimated_time}</p>}
            {resolution.escalate && (
              <p className="warning">
                <strong>Escalation Required:</strong> {resolution.escalate_to || 'L3 Team'}
              </p>
            )}
            {resolution.resolution_steps && resolution.resolution_steps.length > 0 && (
              <>
                <h3>Steps:</h3>
                <ol>
                  {resolution.resolution_steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </>
            )}
          </>
        )}
      </section>

      {/* Notes */}
      <section className="card">
        <h2>Notes</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes about this ticket..."
          rows="4"
        />
      </section>

      {/* Custom Fields */}
      <section className="card">
        <h2>Custom Fields</h2>
        {Object.keys(customFields).length > 0 && (
          <div className="custom-fields-list">
            {Object.entries(customFields).map(([key, value]) => (
              <div key={key} className="custom-field-item">
                <strong>{key}:</strong> {value}
                <button
                  onClick={() => removeCustomField(key)}
                  className="remove-field-button"
                  title="Remove field"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="custom-field-input">
          <input
            type="text"
            placeholder="Field name"
            value={newFieldKey}
            onChange={(e) => setNewFieldKey(e.target.value)}
          />
          <input
            type="text"
            placeholder="Field value"
            value={newFieldValue}
            onChange={(e) => setNewFieldValue(e.target.value)}
          />
          <button onClick={addCustomField}>Add Field</button>
        </div>
      </section>

      {/* Actions */}
      <div className="ticket-actions">
        {isEditing ? (
          <>
            <button onClick={handleSave} disabled={saving} className="primary">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button onClick={() => setIsEditing(false)} disabled={saving}>
              Cancel
            </button>
          </>
        ) : (
          <>
            {ticket.status === 'active' && (
              <>
                <button onClick={() => setIsEditing(true)} className="primary">
                  Edit Diagnosis
                </button>
                <button onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Notes'}
                </button>
                <button onClick={handleClose} disabled={saving} className="success">
                  Close Ticket
                </button>
              </>
            )}
            <button onClick={handleDelete} disabled={saving} className="danger">
              Delete Ticket
            </button>
          </>
        )}
      </div>
    </div>
  );
}

