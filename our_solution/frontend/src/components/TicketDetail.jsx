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
  Minus
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
import { getTicket, updateTicket, closeTicket, deleteTicket, permanentDeleteTicket } from '../api.js';

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
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (propTicket) {
      setTicket(propTicket);
      setLoading(false);
    } else {
      loadTicket();
    }
  }, [ticketId, propTicket]);

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
      onTicketUpdated?.();
    } catch (err) {
      setError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async () => {
    setShowCloseDialog(false);
    setSaving(true);
    setError('');
    try {
      const updatedTicket = await closeTicket(ticketId);
      console.log('Ticket closed successfully:', updatedTicket);
      if (updatedTicket) {
        setTicket(updatedTicket); // Update local state with closed ticket
        onTicketUpdated?.();
      }
    } catch (err) {
      console.error('Error closing ticket:', err);
      setError(err.message || 'Failed to close ticket');
    } finally {
      setSaving(false);
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
    setSaving(true);
    setError('');
    try {
      const updatedTicket = await deleteTicket(ticketId, finalReason);
      console.log('Ticket moved to deleted:', updatedTicket);
      setTicket(updatedTicket);
      setDeletionReason('');
      setDeletionReasonType('');
      setCustomDeletionReason('');
      onTicketUpdated?.();
      setSaving(false);
    } catch (err) {
      console.error('Error deleting ticket:', err);
      setError(err.message || 'Failed to delete ticket');
      setSaving(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (deletePassword !== '67') {
      setError('Incorrect password');
      return;
    }

    setShowPermanentDeleteDialog(false);
    setSaving(true);
    setError('');
    try {
      await permanentDeleteTicket(ticketId, deletePassword);
      console.log('Ticket permanently deleted');
      setDeletePassword('');
      onTicketUpdated?.();
      onBack();
    } catch (err) {
      console.error('Error permanently deleting ticket:', err);
      setError(err.message || 'Failed to permanently delete ticket');
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

  if (loading || (saving && !ticket)) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-24" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
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

  const displayData = ticket.edited_diagnosis || ticket.diagnosis_data;
  const parsed = displayData.parsed || {};
  const rootCause = displayData.rootCause || {};
  const resolution = displayData.resolution || {};

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to List
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Ticket #{ticket.ticket_number}
              <Badge variant={ticket.status === 'active' ? 'default' : ticket.status === 'closed' ? 'secondary' : 'destructive'}>
                {ticket.status}
              </Badge>
            </h1>
            <p className="text-sm text-muted-foreground">View and edit ticket details</p>
          </div>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-destructive/10 border border-destructive/20 rounded-md"
        >
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="diagnosis">Diagnosis</TabsTrigger>
          <TabsTrigger value="resolution">Resolution Plan</TabsTrigger>
          <TabsTrigger value="confidence">Confidence</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Overview Content */}
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
                                <Badge variant={parsed.priority === 'High' ? 'destructive' : 'secondary'}>
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

              {/* Original Alert */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Original Alert
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto whitespace-pre-wrap font-mono">
                    {ticket.alert_text}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="diagnosis" className="space-y-6 mt-6">
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
            </div>
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
                  {ticket.confidence_assessment ? (
                    <div className="space-y-6">
                      {/* Overall Score */}
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Overall Confidence Score</Label>
                          <p className="text-3xl font-bold mt-1">{ticket.confidence_assessment.overall_score}%</p>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={
                              ticket.confidence_assessment.overall_score >= 70 ? "default" :
                                ticket.confidence_assessment.overall_score >= 50 ? "secondary" :
                                  "destructive"
                            }
                            className="text-sm"
                          >
                            {ticket.confidence_assessment.interpretation.recommendation}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {ticket.confidence_assessment.interpretation.recommendation_detail}
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
                                  {ticket.confidence_assessment.breakdown.log_evidence?.percentage || 0}%
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {ticket.confidence_assessment.breakdown.log_evidence?.status || 'none'}
                                </Badge>
                              </div>
                            </div>
                            <Progress
                              value={ticket.confidence_assessment.breakdown.log_evidence.percentage}
                              className="h-2"
                            />
                          </div>

                          {/* Past Cases */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-medium">Similar Past Cases</Label>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                  {ticket.confidence_assessment.breakdown.past_cases?.percentage || 0}%
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {ticket.confidence_assessment.breakdown.past_cases?.status || 'none'}
                                </Badge>
                              </div>
                            </div>
                            <Progress
                              value={ticket.confidence_assessment.breakdown.past_cases.percentage}
                              className="h-2"
                            />
                          </div>

                          {/* Knowledge Base */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-medium">Knowledge Base</Label>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                  {ticket.confidence_assessment.breakdown.knowledge_base?.percentage || 0}%
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {ticket.confidence_assessment.breakdown.knowledge_base?.status || 'none'}
                                </Badge>
                              </div>
                            </div>
                            <Progress
                              value={ticket.confidence_assessment.breakdown.knowledge_base.percentage}
                              className="h-2"
                            />
                          </div>

                          {/* Identifiers */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-medium">Specific Identifiers</Label>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                  {ticket.confidence_assessment.breakdown.identifiers?.percentage || 0}%
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {ticket.confidence_assessment.breakdown.identifiers?.status || 'none'}
                                </Badge>
                              </div>
                            </div>
                            <Progress
                              value={ticket.confidence_assessment.breakdown.identifiers.percentage}
                              className="h-2"
                            />
                          </div>

                          {/* Evidence Quality */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-medium">Evidence Quality</Label>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                  {ticket.confidence_assessment.breakdown.evidence_quality?.percentage || 0}%
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {ticket.confidence_assessment.breakdown.evidence_quality?.status || 'none'}
                                </Badge>
                              </div>
                            </div>
                            <Progress
                              value={ticket.confidence_assessment.breakdown.evidence_quality.percentage}
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
                                ticket.confidence_assessment.interpretation.diagnosis_confidence === "HIGH" ? "default" :
                                  ticket.confidence_assessment.interpretation.diagnosis_confidence === "MODERATE" ? "secondary" :
                                    "destructive"
                              }
                            >
                              {ticket.confidence_assessment.interpretation.diagnosis_confidence}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {ticket.confidence_assessment.interpretation.diagnosis_explanation}
                          </p>
                        </div>

                        {/* Solution Confidence */}
                        <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Solution Confidence</Label>
                            <Badge
                              variant={
                                ticket.confidence_assessment.interpretation.solution_confidence === "HIGH" ? "default" :
                                  ticket.confidence_assessment.interpretation.solution_confidence === "MODERATE" ? "secondary" :
                                    "destructive"
                              }
                            >
                              {ticket.confidence_assessment.interpretation.solution_confidence}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {ticket.confidence_assessment.interpretation.solution_explanation}
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3 pt-6 border-t"
        >
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
              {ticket.status === 'active' && activeTab === 'diagnosis' && (
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
        </motion.div>

        {/* Ticket Dates - Bottom Right - Outside Container */}
        {ticket && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 right-6 bg-background/80 backdrop-blur-sm border rounded-lg p-3 shadow-lg"
          >
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Created: {formatDateTime(ticket.created_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Updated: {formatDateTime(ticket.updated_at)}</span>
              </div>
            </div>
          </motion.div>
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