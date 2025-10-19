import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Clock,
  Calendar,
  User,
  Tag,
  Phone,
  Mail,
  MessageSquare,
  FileText,
  Settings,
  Plus,
  Minus,
  BarChart3,
  Loader2
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Skeleton } from './ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getTicket, updateTicket, closeTicket, deleteTicket, permanentDeleteTicket } from '../api.js';
import EscalationDetails from './EscalationDetails';

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

function getChannelIcon(channel) {
  switch (channel) {
    case 'Email': return <Mail className="w-4 h-4" />;
    case 'SMS': return <MessageSquare className="w-4 h-4" />;
    case 'Phone': return <Phone className="w-4 h-4" />;
    default: return <FileText className="w-4 h-4" />;
  }
}

export default function TicketDetail({ ticketId, ticket: propTicket, onBack, onTicketUpdated }) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState('loading'); // 'loading', 'closing', 'deleting', 'permanent-deleting'
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPermanentDeleteDialog, setShowPermanentDeleteDialog] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');
  const [deletionReasonType, setDeletionReasonType] = useState('');
  const [customDeletionReason, setCustomDeletionReason] = useState('');
  const [deletePassword, setDeletePassword] = useState('');

  // Editable fields
  const [editedRootCause, setEditedRootCause] = useState('');
  const [editedTechnicalDetails, setEditedTechnicalDetails] = useState('');
  const [editedResolutionSteps, setEditedResolutionSteps] = useState('');
  const [notes, setNotes] = useState('');
  const [customFields, setCustomFields] = useState({});
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const [activeTab, setActiveTab] = useState('alert-summary');

  const loadTicket = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const fetchedTicket = await getTicket(ticketId);
      setTicket(fetchedTicket);

      // Initialize all fields
      const diagnosis = fetchedTicket.edited_diagnosis || fetchedTicket.diagnosis_data;
      setEditedRootCause(diagnosis?.rootCause?.root_cause || '');
      setEditedTechnicalDetails(diagnosis?.rootCause?.technical_details || '');
      setEditedResolutionSteps(
        Array.isArray(diagnosis?.resolution?.resolution_steps)
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
  }, [ticketId]);

  useEffect(() => {
    if (propTicket) {
      setTicket(propTicket);
      setLoading(false);
    } else {
      loadTicket();
    }
  }, [ticketId, propTicket, loadTicket]);

  // Set document title based on ticket ID
  useEffect(() => {
    if (ticket) {
      const parsedData = ticket.diagnosis_data?.parsed || {};
      const ticketDisplayId = parsedData.ticket_id || `#${ticket.ticket_number}`;
      document.title = `Ticket ${ticketDisplayId} - PSA Diagnostic Assistant`;
    }
    return () => {
      document.title = 'PSA Diagnostic Assistant';
    };
  }, [ticket]);

  const handleSave = async () => {
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

    // Optimistic update - update UI immediately
    const optimisticTicket = {
      ...ticket,
      edited_diagnosis: editedDiagnosis,
      notes,
      custom_fields: customFields,
    };
    setTicket(optimisticTicket);
    setIsEditing(false); // Exit edit mode immediately

    setSaving(true);
    setError('');
    try {
      const updated = await updateTicket(ticketId, {
        edited_diagnosis: editedDiagnosis,
        notes,
        custom_fields: customFields,
      });

      setTicket(updated);
      // Update cache
      const cachedTickets = sessionStorage.getItem('cachedTickets');
      if (cachedTickets) {
        const tickets = JSON.parse(cachedTickets);
        const updatedTickets = tickets.map(t => t.id === ticketId ? updated : t);
        sessionStorage.setItem('cachedTickets', JSON.stringify(updatedTickets));
      }
      onTicketUpdated?.();
    } catch (err) {
      setError(err.message || 'Failed to save changes');
      // Rollback on error
      setTicket(ticket);
      setIsEditing(true);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async () => {
    setShowCloseDialog(false);

    // Optimistic update - update UI immediately
    const optimisticTicket = {
      ...ticket,
      status: 'closed',
      closed_at: new Date().toISOString()
    };
    setTicket(optimisticTicket);

    setSaving(true);
    setError('');

    try {
      const updatedTicket = await closeTicket(ticketId);
      console.log('Ticket closed successfully:', updatedTicket);
      if (updatedTicket) {
        // Update cache
        const cachedTickets = sessionStorage.getItem('cachedTickets');
        if (cachedTickets) {
          const tickets = JSON.parse(cachedTickets);
          const updatedTickets = tickets.map(t => t.id === ticketId ? updatedTicket : t);
          sessionStorage.setItem('cachedTickets', JSON.stringify(updatedTickets));
        }
        onTicketUpdated?.();

        // Wait briefly to show success, then navigate back
        setTimeout(() => {
          onBack();
        }, 500);
      }
    } catch (err) {
      console.error('Error closing ticket:', err);
      setError(err.message || 'Failed to close ticket');
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    // Determine the final reason
    const finalReason = deletionReasonType === 'Others'
      ? customDeletionReason.trim()
      : deletionReasonType;

    if (!finalReason) {
      setError('Please provide a reason for deletion');
      return;
    }

    if (deletionReasonType === 'Others' && !customDeletionReason.trim()) {
      setError('Please specify the reason');
      return;
    }

    setShowDeleteDialog(false);

    // Optimistic update - update UI immediately
    const optimisticTicket = {
      ...ticket,
      status: 'deleted',
      deletion_reason: finalReason,
      deleted_at: new Date().toISOString()
    };
    setTicket(optimisticTicket);

    setSaving(true);
    setError('');

    try {
      const updatedTicket = await deleteTicket(ticketId, finalReason);
      console.log('Ticket moved to deleted:', updatedTicket);

      // Update cache
      const cachedTickets = sessionStorage.getItem('cachedTickets');
      if (cachedTickets) {
        const tickets = JSON.parse(cachedTickets);
        const updatedTickets = tickets.map(t => t.id === ticketId ? updatedTicket : t);
        sessionStorage.setItem('cachedTickets', JSON.stringify(updatedTickets));
      }

      setDeletionReason('');
      setDeletionReasonType('');
      setCustomDeletionReason('');
      onTicketUpdated?.();

      // Wait briefly to show success, then navigate back
      setTimeout(() => {
        onBack();
      }, 500);
    } catch (err) {
      console.error('Error deleting ticket:', err);
      setError(err.message || 'Failed to delete ticket');
      setLoading(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (deletePassword !== '67') {
      setError('Incorrect password');
      return;
    }

    setShowPermanentDeleteDialog(false);

    // Optimistic navigation - go back immediately for instant feel
    onBack();

    // Update cache to remove ticket
    const cachedTickets = sessionStorage.getItem('cachedTickets');
    if (cachedTickets) {
      const tickets = JSON.parse(cachedTickets);
      const updatedTickets = tickets.filter(t => t.id !== ticketId);
      sessionStorage.setItem('cachedTickets', JSON.stringify(updatedTickets));
    }

    setSaving(true);
    setError('');

    try {
      await permanentDeleteTicket(ticketId, deletePassword);
      console.log('Ticket permanently deleted');

      // Update cache to remove ticket
      const cachedTickets = sessionStorage.getItem('cachedTickets');
      if (cachedTickets) {
        const tickets = JSON.parse(cachedTickets);
        const updatedTickets = tickets.filter(t => t.id !== ticketId);
        sessionStorage.setItem('cachedTickets', JSON.stringify(updatedTickets));
      }

      setDeletePassword('');
      onTicketUpdated?.();

      // Wait briefly to show success, then navigate back
      setTimeout(() => {
        onBack();
      }, 500);
    } catch (err) {
      console.error('Error permanently deleting ticket:', err);
      setError(err.message || 'Failed to permanently delete ticket');
      setLoading(false);
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

  // IMPORTANT: useMemo hooks MUST be called before any conditional returns
  // to satisfy React's Rules of Hooks
  const displayData = useMemo(() =>
    ticket?.edited_diagnosis || ticket?.diagnosis_data || {},
    [ticket?.edited_diagnosis, ticket?.diagnosis_data]
  );

  const parsed = useMemo(() => displayData?.parsed || {}, [displayData]);
  const rootCause = useMemo(() => displayData?.rootCause || {}, [displayData]);
  const resolution = useMemo(() => displayData?.resolution || {}, [displayData]);
  const confidenceAssessment = useMemo(() =>
    displayData?.confidence_assessment || displayData?.confidenceAssessment || null,
    [displayData]
  );

  // Ticket display data - must be here before conditional returns
  const parsedData = useMemo(() => ticket?.diagnosis_data?.parsed || {}, [ticket?.diagnosis_data?.parsed]);
  const ticketDisplayId = useMemo(() => parsedData.ticket_id || `#${ticket?.ticket_number || ''}`, [parsedData.ticket_id, ticket?.ticket_number]);

  if (loading || (saving && !ticket)) {
    const loadingMessages = {
      'loading': {
        title: 'Loading Ticket Details',
        message: 'Please wait while we fetch the ticket information...'
      },
      'closing': {
        title: 'Closing Ticket',
        message: 'Updating ticket status and redirecting you back...'
      },
      'deleting': {
        title: 'Deleting Ticket',
        message: 'Moving ticket to deleted and redirecting you back...'
      },
      'permanent-deleting': {
        title: 'Permanently Deleting Ticket',
        message: 'Removing ticket permanently and redirecting you back...'
      }
    };

    const { title, message } = loadingMessages[loadingAction] || loadingMessages.loading;

    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to List
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Error Loading Ticket
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
            <p className="text-sm text-muted-foreground mt-2">
              This ticket may have been deleted or there was a database error.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (!ticket) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to List
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Ticket Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              The requested ticket could not be found. It may have been deleted or the ID is invalid.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to List
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="alert-summary">Alert Summary</TabsTrigger>
          <TabsTrigger value="root-cause">Root Cause Analysis</TabsTrigger>
          <TabsTrigger value="resolution">Resolution Plan</TabsTrigger>
          <TabsTrigger value="confidence">Confidence</TabsTrigger>
          <TabsTrigger value="full-report">Full Report</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="alert-summary" className="space-y-6 mt-6">
          {/* Alert Summary Content */}
          <div className="space-y-6">
            <div className="space-y-6 mt-6">

              {/* Parsed Information */}
              {parsed && Object.keys(parsed).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="w-5 h-5" />
                      Parsed Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {parsed.ticket_id && <TableHead>Ticket ID</TableHead>}
                            {parsed.module && <TableHead>Module</TableHead>}
                            {parsed.entity_id && <TableHead>Entity</TableHead>}
                            {parsed.channel && <TableHead>Channel</TableHead>}
                            {parsed.priority && <TableHead>Priority</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            {parsed.ticket_id && (
                              <TableCell>
                                <Badge variant="outline" className="font-mono">{parsed.ticket_id}</Badge>
                              </TableCell>
                            )}
                            {parsed.module && (
                              <TableCell>
                                <Badge variant="outline">{parsed.module}</Badge>
                              </TableCell>
                            )}
                            {parsed.entity_id && (
                              <TableCell>
                                <Badge variant="outline">{parsed.entity_id}</Badge>
                              </TableCell>
                            )}
                            {parsed.channel && (
                              <TableCell>
                                <Badge variant="outline" className="gap-1">
                                  {getChannelIcon(parsed.channel)}
                                  {parsed.channel}
                                </Badge>
                              </TableCell>
                            )}
                            {parsed.priority && (
                              <TableCell>
                                <Badge variant={
                                  parsed.priority === 'High' ? 'destructive' :
                                    parsed.priority === 'Medium' ? 'warning' :
                                      'success'
                                }>
                                  {parsed.priority}
                                </Badge>
                              </TableCell>
                            )}
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

            </div>
          </div>
        </TabsContent>

        <TabsContent value="root-cause" className="space-y-6 mt-6">
          {/* Root Cause Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Root Cause Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="root-cause">Root Cause</Label>
                    <Textarea
                      id="root-cause"
                      value={editedRootCause}
                      onChange={(e) => setEditedRootCause(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="technical-details">Technical Details</Label>
                    <Textarea
                      id="technical-details"
                      value={editedTechnicalDetails}
                      onChange={(e) => setEditedTechnicalDetails(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Root Cause</Label>
                    <p className="mt-1 text-sm leading-relaxed">{rootCause.root_cause}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Technical Details</Label>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {rootCause.technical_details}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resolution" className="space-y-6 mt-6">
          {/* Resolution Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Resolution Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="space-y-2">
                  <Label htmlFor="resolution-steps">Resolution Steps (one per line)</Label>
                  <Textarea
                    id="resolution-steps"
                    value={editedResolutionSteps}
                    onChange={(e) => setEditedResolutionSteps(e.target.value)}
                    rows="6"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {resolution.estimated_time && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Estimated Time</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{resolution.estimated_time}</span>
                        </div>
                      </div>
                    )}
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Escalation</Label>
                      <div className="mt-1">
                        {resolution.escalate ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Yes → {resolution.escalate_to || 'L3 team'}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">No</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Escalation Details */}
                  {resolution.escalate && (
                    <EscalationDetails
                      module={parsed.module}
                      escalateTo={resolution.escalate_to}
                      escalateReason={resolution.escalate_reason}
                    />
                  )}

                  {resolution.resolution_steps?.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-muted-foreground">Resolution Steps</Label>
                        {resolution.time_breakdown?.resolution_steps_time && (
                          <Badge variant="outline" className="text-xs">
                            {resolution.time_breakdown.resolution_steps_time}
                          </Badge>
                        )}
                      </div>
                      <ol className="mt-2 space-y-2">
                        {resolution.resolution_steps.map((step, index) => (
                          <li key={index} className="text-sm flex items-start gap-3">
                            <span className="w-6 h-6 bg-muted text-foreground rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                              {index + 1}
                            </span>
                            <span className="leading-relaxed">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {resolution.verification_steps?.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-muted-foreground">Verification Steps</Label>
                        {resolution.time_breakdown?.verification_steps_time && (
                          <Badge variant="outline" className="text-xs">
                            {resolution.time_breakdown.verification_steps_time}
                          </Badge>
                        )}
                      </div>
                      <ul className="mt-2 space-y-1">
                        {resolution.verification_steps.map((step, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {resolution.sql_queries?.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-muted-foreground">SQL / Commands</Label>
                        {resolution.time_breakdown?.sql_commands_time && (
                          <Badge variant="outline" className="text-xs">
                            {resolution.time_breakdown.sql_commands_time}
                          </Badge>
                        )}
                      </div>
                      <pre className="mt-2 p-3 bg-muted rounded-md text-xs font-mono overflow-x-auto">
                        {resolution.sql_queries.join('\n\n')}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="confidence" className="space-y-6 mt-6">
          {/* Confidence Assessment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Confidence Assessment
              </CardTitle>
              <CardDescription>
                Evidence-based confidence analysis for diagnosis and resolution
              </CardDescription>
            </CardHeader>
            <CardContent>
              {confidenceAssessment ? (
                <div className="space-y-6">
                  {/* Overall Score */}
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Overall Confidence Score</Label>
                      <p className="text-3xl font-bold mt-1">{confidenceAssessment.overall_score}%</p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          confidenceAssessment.overall_score >= 70 ? "default" :
                            confidenceAssessment.overall_score >= 50 ? "secondary" :
                              "destructive"
                        }
                        className="text-sm"
                      >
                        {confidenceAssessment.interpretation.recommendation}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {confidenceAssessment.interpretation.recommendation_detail}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Evidence Breakdown */}
                  <div>
                    <Label className="text-base font-semibold mb-4 block">Evidence Quality Breakdown</Label>
                    <div className="space-y-4">
                      {/* Log Evidence */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Application Logs</Label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {confidenceAssessment.breakdown.log_evidence?.percentage || 0}%
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {confidenceAssessment.breakdown.log_evidence?.status || 'none'}
                            </Badge>
                          </div>
                        </div>
                        <Progress
                          value={confidenceAssessment.breakdown.log_evidence.percentage}
                          className="h-2"
                        />
                      </div>

                      {/* Past Cases */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Similar Past Cases</Label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {confidenceAssessment.breakdown.past_cases?.percentage || 0}%
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {confidenceAssessment.breakdown.past_cases?.status || 'none'}
                            </Badge>
                          </div>
                        </div>
                        <Progress
                          value={confidenceAssessment.breakdown.past_cases.percentage}
                          className="h-2"
                        />
                      </div>

                      {/* Knowledge Base */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Knowledge Base</Label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {confidenceAssessment.breakdown.knowledge_base?.percentage || 0}%
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {confidenceAssessment.breakdown.knowledge_base?.status || 'none'}
                            </Badge>
                          </div>
                        </div>
                        <Progress
                          value={confidenceAssessment.breakdown.knowledge_base.percentage}
                          className="h-2"
                        />
                      </div>

                      {/* Identifiers */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Specific Identifiers</Label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {confidenceAssessment.breakdown.identifiers?.percentage || 0}%
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {confidenceAssessment.breakdown.identifiers?.status || 'none'}
                            </Badge>
                          </div>
                        </div>
                        <Progress
                          value={confidenceAssessment.breakdown.identifiers.percentage}
                          className="h-2"
                        />
                      </div>

                      {/* Evidence Quality */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Evidence Quality</Label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {confidenceAssessment.breakdown.evidence_quality?.percentage || 0}%
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {confidenceAssessment.breakdown.evidence_quality?.status || 'none'}
                            </Badge>
                          </div>
                        </div>
                        <Progress
                          value={confidenceAssessment.breakdown.evidence_quality.percentage}
                          className="h-2"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Interpretation */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold block">Interpretation</Label>

                    {/* Diagnosis Confidence */}
                    <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Diagnosis Confidence</Label>
                        <Badge
                          variant={
                            confidenceAssessment.interpretation.diagnosis_confidence === "HIGH" ? "default" :
                              confidenceAssessment.interpretation.diagnosis_confidence === "MODERATE" ? "secondary" :
                                "destructive"
                          }
                        >
                          {confidenceAssessment.interpretation.diagnosis_confidence}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {confidenceAssessment.interpretation.diagnosis_explanation}
                      </p>
                    </div>

                    {/* Solution Confidence */}
                    <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Solution Confidence</Label>
                        <Badge
                          variant={
                            confidenceAssessment.interpretation.solution_confidence === "HIGH" ? "default" :
                              confidenceAssessment.interpretation.solution_confidence === "MODERATE" ? "secondary" :
                                "destructive"
                          }
                        >
                          {confidenceAssessment.interpretation.solution_confidence}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {confidenceAssessment.interpretation.solution_explanation}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No confidence assessment available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="full-report" className="space-y-6 mt-6">
          {/* Full Report - Exact same as DiagnosticForm */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Full Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none bg-muted p-4 rounded-md">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {displayData.report || 'No report available'}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-6 mt-6">
          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this ticket..."
                rows="4"
              />
            </CardContent>
          </Card>

          {/* Custom Fields */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Custom Fields
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.keys(customFields).length > 0 && (
                <div className="space-y-2">
                  {Object.entries(customFields).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-muted rounded-md">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{key}:</span>
                        <span className="text-sm text-muted-foreground">{value}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCustomField(key)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  placeholder="Field name"
                  value={newFieldKey}
                  onChange={(e) => setNewFieldKey(e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Field value"
                  value={newFieldValue}
                  onChange={(e) => setNewFieldValue(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={addCustomField} size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex gap-3 pt-6 border-t">
        {isEditing ? (
          <>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button onClick={() => setIsEditing(false)} disabled={saving} variant="outline">
              Cancel
            </Button>
          </>
        ) : (
          <>
            {/* Edit Diagnosis Button - Only on Diagnosis Tab */}
            {ticket.status === 'active' && activeTab === 'root-cause' && (
              <Button onClick={() => setIsEditing(true)} className="gap-2">
                <Edit className="w-4 h-4" />
                Edit Diagnosis
              </Button>
            )}

            {/* Save Notes Button - Only on Notes Tab */}
            {ticket.status === 'active' && activeTab === 'notes' && (
              <Button onClick={handleSave} disabled={saving} variant="outline" className="gap-2">
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Notes'}
              </Button>
            )}

            {/* Close Ticket Button - Always visible for active tickets */}
            {ticket.status === 'active' && (
              <Button onClick={() => setShowCloseDialog(true)} disabled={saving} className="gap-2 bg-green-600 hover:bg-green-700 text-white border-2 border-green-700">
                <CheckCircle className="w-4 h-4" />
                Close Ticket
              </Button>
            )}

            {/* Delete Buttons - Always visible */}
            {ticket.status !== 'deleted' && (
              <Button onClick={() => setShowDeleteDialog(true)} disabled={saving} variant="destructive" className="gap-2">
                <Trash2 className="w-4 h-4" />
                Move to Deleted
              </Button>
            )}
            {ticket.status === 'deleted' && (
              <Button onClick={() => setShowPermanentDeleteDialog(true)} disabled={saving} variant="destructive" className="gap-2">
                <Trash2 className="w-4 h-4" />
                Permanent Delete
              </Button>
            )}
          </>
        )}
      </div>

      {/* Ticket Dates - Bottom Right - Outside Container */}
      {ticket && (
        <div className="fixed bottom-6 right-6 bg-background/80 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Created: {formatDateTime(ticket.created_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Updated: {formatDateTime(ticket.updated_at)}</span>
            </div>
            {ticket.status === 'closed' && ticket.closed_at && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Closed: {formatDateTime(ticket.closed_at)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Close Ticket Confirmation Dialog */}
      <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close this ticket?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the ticket as resolved and move it to closed tickets. You can still view it later in the tickets list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClose}>Close Ticket</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Ticket Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move ticket to deleted?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move the ticket to deleted tickets. Please provide a reason for deletion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="deletion-reason-type">Reason for deletion *</Label>
              <Select value={deletionReasonType} onValueChange={setDeletionReasonType}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Duplicate ticket">Duplicate ticket</SelectItem>
                  <SelectItem value="Created by mistake">Created by mistake</SelectItem>
                  <SelectItem value="Issue not reproducible">Issue not reproducible</SelectItem>
                  <SelectItem value="Resolved through other means">Resolved through other means</SelectItem>
                  <SelectItem value="Invalid alert">Invalid alert</SelectItem>
                  <SelectItem value="Spam or test ticket">Spam or test ticket</SelectItem>
                  <SelectItem value="Others">Others</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {deletionReasonType === 'Others' && (
              <div>
                <Label htmlFor="custom-reason">Please specify *</Label>
                <Textarea
                  id="custom-reason"
                  value={customDeletionReason}
                  onChange={(e) => setCustomDeletionReason(e.target.value)}
                  placeholder="Enter your reason for deletion..."
                  className="mt-2"
                  rows={3}
                />
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeletionReasonType('');
              setCustomDeletionReason('');
            }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Move to Deleted
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanent Delete Dialog (for deleted tickets only) */}
      <AlertDialog open={showPermanentDeleteDialog} onOpenChange={setShowPermanentDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete this ticket?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The ticket and all its data will be permanently removed from the database.
              <br /><br />
              <strong>Please enter the supervisor password to proceed.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="delete-password">Password *</Label>
            <Input
              id="delete-password"
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Enter password"
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Please get the password from your supervisor if you don't have it.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletePassword('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePermanentDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Permanently Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}