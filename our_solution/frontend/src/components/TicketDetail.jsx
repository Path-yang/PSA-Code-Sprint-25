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
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Skeleton } from './ui/skeleton';
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

function getChannelIcon(channel) {
  switch (channel) {
    case 'Email': return <Mail className="w-4 h-4" />;
    case 'SMS': return <MessageSquare className="w-4 h-4" />;
    case 'Phone': return <Phone className="w-4 h-4" />;
    default: return <FileText className="w-4 h-4" />;
  }
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
      onTicketUpdated?.();
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
      onTicketUpdated?.();
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
      onTicketUpdated?.();
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to List
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Ticket #{ticket.id}</h1>
              <Badge
                variant={ticket.status === 'active' ? 'default' : 'secondary'}
                className="gap-1"
              >
                {ticket.status === 'active' ? (
                  <AlertTriangle className="w-3 h-3" />
                ) : (
                  <CheckCircle className="w-3 h-3" />
                )}
                {ticket.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">View and manage ticket details</p>
          </div>
        </div>

        <div className="flex gap-2">
          {ticket.status === 'active' && (
            <Button
              variant="outline"
              onClick={() => setIsEditing(!isEditing)}
              className="gap-2"
            >
              {isEditing ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
          )}
        </div>
      </motion.div>

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

      {/* Main Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="diagnosis">Diagnosis</TabsTrigger>
          <TabsTrigger value="resolution">Resolution Plan</TabsTrigger>
          <TabsTrigger value="confidence">Confidence</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Ticket Information */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Ticket Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{formatDateTime(ticket.created_at)}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{formatDateTime(ticket.updated_at)}</span>
                  </div>
                </div>
                {ticket.closed_at && (
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-muted-foreground">Closed</Label>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">{formatDateTime(ticket.closed_at)}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {parsed.ticket_id && (
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-muted-foreground">Ticket ID</Label>
                      <Badge variant="outline" className="font-mono">{parsed.ticket_id}</Badge>
                    </div>
                  )}
                  {parsed.module && (
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-muted-foreground">Module</Label>
                      <Badge variant="outline">{parsed.module}</Badge>
                    </div>
                  )}
                  {parsed.entity_id && (
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-muted-foreground">Entity</Label>
                      <Badge variant="outline">{parsed.entity_id}</Badge>
                    </div>
                  )}
                  {parsed.channel && (
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-muted-foreground">Channel</Label>
                      <Badge variant="outline" className="gap-1">
                        {getChannelIcon(parsed.channel)}
                        {parsed.channel}
                      </Badge>
                    </div>
                  )}
                  {parsed.priority && (
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-muted-foreground">Priority</Label>
                      <Badge variant={parsed.priority === 'High' ? 'destructive' : 'secondary'}>
                        {parsed.priority}
                      </Badge>
                    </div>
                  )}
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
        </TabsContent>

        <TabsContent value="diagnosis" className="space-y-6">
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

        <TabsContent value="resolution" className="space-y-6">
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
        </TabsContent>

        <TabsContent value="confidence" className="space-y-6">
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

        <TabsContent value="notes" className="space-y-6">
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
            {ticket.status === 'active' && (
              <>
                <Button onClick={() => setIsEditing(true)} className="gap-2">
                  <Edit className="w-4 h-4" />
                  Edit Diagnosis
                </Button>
                <Button onClick={handleSave} disabled={saving} variant="outline" className="gap-2">
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Notes'}
                </Button>
                <Button onClick={handleClose} disabled={saving} variant="secondary" className="gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Close Ticket
                </Button>
              </>
            )}
            <Button onClick={handleDelete} disabled={saving} variant="destructive" className="gap-2">
              <Trash2 className="w-4 h-4" />
              Delete Ticket
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
}