import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlipWords } from './ui/flip-words';
import {
    Zap,
    FileText,
    Clock,
    CheckCircle,
    AlertTriangle,
    Loader2,
    Sparkles,
    Settings
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button as MovingBorderButton } from './ui/moving-border';
import { Button as StatefulButton } from './ui/stateful-button';
import { diagnoseAlert } from '../api.js';
import EscalationDetails from './EscalationDetails';
import QueueStatusIndicator from './QueueStatusIndicator';

const placeholder = `Paste a ticket (email/SMS/call). Example:

RE: Email ALR-861600 | CMAU0000020 - Duplicate Container information received

Hi team,...`;

export default function DiagnosticForm({ onTicketCreated, onDiagnosisChange, onTicketCreatedChange }) {
    const [alertText, setAlertText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [diagnosis, setDiagnosis] = useState(null);
    const [ticketCreated, setTicketCreated] = useState(false);
    const [requestId, setRequestId] = useState(null);
    const [greeting, setGreeting] = useState('');
    const [showResults, setShowResults] = useState(false);
    // Utility: render black oval badges for confidence labels (LOW/MODERATE/HIGH)
    const getConfidenceBadgeClass = (status) => {
        const s = (status || '').toString().toLowerCase();
        return (s === 'low' || s === 'moderate' || s === 'high')
            ? 'bg-foreground text-background border-foreground'
            : '';
    };

    // Generate time-based greeting
    useEffect(() => {
        const getGreeting = () => {
            const hour = new Date().getHours();
            if (hour < 12) {
                return 'Good morning';
            } else if (hour < 17) {
                return 'Good afternoon';
            } else {
                return 'Good evening';
            }
        };
        setGreeting(getGreeting());
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!alertText.trim()) {
            setError('Please paste an alert before running diagnostics.');
            return;
        }

        setLoading(true);
        setError('');
        setDiagnosis(null);
        setShowResults(false); // Reset results visibility
        setTicketCreated(false);
        setRequestId(null); // Reset request ID

        try {
            const result = await diagnoseAlert(alertText.trim());
            console.log('API Response:', result);
            if (result.error) {
                // Check if it's a backend JSON parsing error (indicates invalid input)
                if (result.error.includes('JSON') || result.error.includes('NoneType') || result.error.includes('str, bytes')) {
                    throw new Error(
                        'Unable to parse alert information. Please ensure your alert contains:\n' +
                        '• A ticket ID or reference number\n' +
                        '• Module information (Container, Vessel, EDI/API, etc.)\n' +
                        '• Channel information (Email, SMS, Phone)\n' +
                        '• A clear description of the issue\n\n' +
                        'Example format: "RE: Email ALR-123456 | CMAU0000020 - Container issue..."'
                    );
                }
                throw new Error(result.error);
            }
            
            // Capture request ID for queue tracking
            if (result.request_id) {
                setRequestId(result.request_id);
            }
            
            // Normalize module naming to ensure EDI/API is always used on the UI
            const normalizedModule = result?.parsed?.module === 'EDI' ? 'EDI/API' : result?.parsed?.module;
            const normalized = {
                ...result,
                parsed: { ...(result.parsed || {}), module: normalizedModule },
                // Also normalize any escalation target mentions
                resolution: {
                    ...(result.resolution || {}),
                    escalate_to: (result.resolution?.escalate_to || '')
                        .replace('EDI Team', 'EDI/API Team')
                        .replace(/\bEDI\b/g, 'EDI/API')
                }
            };

            // Edge case detection: Check if alert summary is empty (invalid/gibberish input)
            const parsed = normalized.parsed || {};
            const hasTicketId = parsed.ticket_id && parsed.ticket_id !== '—' && parsed.ticket_id.trim() !== '';
            const hasModule = parsed.module && parsed.module !== '—' && parsed.module.trim() !== '';
            const hasChannel = parsed.channel && parsed.channel !== '—' && parsed.channel.trim() !== '';
            const hasEntity = parsed.entity_id && parsed.entity_id !== '—' && parsed.entity_id.trim() !== '';
            
            // Count how many fields are actually populated
            const populatedFields = [hasTicketId, hasModule, hasChannel, hasEntity].filter(Boolean).length;
            
            // If less than 2 fields are populated, consider it invalid input
            if (populatedFields < 2) {
                throw new Error(
                    'Unable to parse alert information. Please ensure your alert contains:\n' +
                    '• A ticket ID or reference number\n' +
                    '• Module information (Container, Vessel, EDI/API, etc.)\n' +
                    '• Channel information (Email, SMS, Phone)\n' +
                    '• A clear description of the issue\n\n' +
                    'Example format: "RE: Email ALR-123456 | CMAU0000020 - Container issue..."'
                );
            }

            setDiagnosis(normalized);
            onDiagnosisChange?.(normalized);
            setShowResults(true);
            setTicketCreated(false);
            onTicketCreatedChange?.(false);
            setError('');
            // Smooth scroll to results after a brief delay
            setTimeout(() => {
                const resultsElement = document.getElementById('diagnosis-results');
                if (resultsElement) {
                    resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 300);
        } catch (err) {
            console.error('Diagnosis error:', err);
            // If error message contains technical jargon, show user-friendly message
            let errorMessage = err.message || 'Diagnostics failed';
            if (errorMessage.includes('JSON') || errorMessage.includes('NoneType') || errorMessage.includes('str, bytes')) {
                errorMessage = 'Unable to parse alert information. Please ensure your alert contains:\n' +
                    '• A ticket ID or reference number\n' +
                    '• Module information (Container, Vessel, EDI/API, etc.)\n' +
                    '• Channel information (Email, SMS, Phone)\n' +
                    '• A clear description of the issue\n\n' +
                    'Example format: "RE: Email ALR-123456 | CMAU0000020 - Container issue..."';
            }
            setError(errorMessage);
            setDiagnosis(null);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className={`min-h-screen p-3 md:p-6 transition-all duration-700 ${showResults ? 'flex flex-col' : 'flex items-start justify-start pt-12 md:pt-24'}`}>
            <div className={`w-full max-w-4xl mx-auto space-y-4 md:space-y-6 relative transition-all duration-500 ${showResults ? 'pt-3 md:pt-6' : ''}`}>

                {/* Greeting */}
                <AnimatePresence>
                    {!showResults && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30, transition: { duration: 0.5 } }}
                            transition={{ duration: 0.6 }}
                            className="text-center mb-4 md:mb-8"
                        >
                            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                                {greeting}
                            </h1>
                            <div className="text-base md:text-lg text-muted-foreground">
                                Ready to <FlipWords
                                    words={['diagnose', 'analyze', 'investigate', 'resolve']}
                                    duration={2000}
                                    className="text-primary font-semibold"
                                /> your alerts? Let's get started.
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Diagnostic Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                        opacity: 1,
                        y: 0,
                        scale: showResults ? 0.98 : 1
                    }}
                    transition={{
                        delay: showResults ? 0 : 0.1,
                        duration: showResults ? 0.6 : 0.3
                    }}
                >
                    <Card className="glass-card">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="w-5 h-5" />
                                        Diagnostic Form
                                    </CardTitle>
                                    <CardDescription>
                                        Paste your alert text below and let our AI analyze the issue
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="alert-text">Alert Text</Label>
                                    <Textarea
                                        id="alert-text"
                                        value={alertText}
                                        placeholder={placeholder}
                                        onChange={(event) => setAlertText(event.target.value)}
                                        className="min-h-[150px] md:min-h-[200px] font-mono text-sm"
                                        style={{ fontSize: '16px' }}
                                    />
                                </div>

                                <StatefulButton
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                                    onClick={handleSubmit}
                                >
                                    {loading ? (
                                        'Analyzing your issue...'
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Zap className="w-4 h-4" />
                                            Run Diagnostics
                                        </div>
                                    )}
                                </StatefulButton>

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="p-4 bg-destructive/10 border border-destructive/20 rounded-md"
                                    >
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                                            <div className="text-destructive text-sm whitespace-pre-line flex-1">
                                                {error}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Queue Status Indicator */}
                {loading && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <QueueStatusIndicator requestId={requestId} />
                    </motion.div>
                )}

                {/* Diagnosis Results */}
                <AnimatePresence>
                    {diagnosis && diagnosis.parsed && diagnosis.rootCause && diagnosis.resolution && (
                        <motion.div
                            id="diagnosis-results"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4, delay: 0.3 }}
                            className="space-y-6"
                        >
                            {/* Ticket Information */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.5 }}
                            >
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <FileText className="w-5 h-5" />
                                            Alert Summary
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="border rounded-md">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b bg-muted/50">
                                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ticket ID</th>
                                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Channel</th>
                                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Module</th>
                                                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Priority</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td className="px-4 py-3 font-mono text-sm">{diagnosis.parsed.ticket_id || '—'}</td>
                                                        <td className="px-4 py-3">
                                                            <Badge variant="outline">{diagnosis.parsed.channel || '—'}</Badge>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm">{(diagnosis.parsed.module === 'EDI' ? 'EDI/API' : diagnosis.parsed.module) || '—'}</td>
                                                        <td className="px-4 py-3">
                                                            <Badge variant={
                                                                diagnosis.parsed.priority === 'High' ? 'destructive' : 
                                                                diagnosis.parsed.priority === 'Medium' ? 'warning' : 
                                                                'success'
                                                            }>
                                                                {diagnosis.parsed.priority || '—'}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Root Cause Analysis */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.7 }}
                            >
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5" />
                                            Root Cause Analysis
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label className="text-sm font-medium text-muted-foreground">Root Cause</Label>
                                            <p className="mt-1 text-sm leading-relaxed">{diagnosis.rootCause.root_cause}</p>
                                        </div>

                                        <div>
                                            <Label className="text-sm font-medium text-muted-foreground">Technical Details</Label>
                                            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                                                {diagnosis.rootCause.technical_details}
                                            </p>
                                        </div>

                                        {diagnosis.rootCause.evidence_summary?.length > 0 && (
                                            <div>
                                                <Label className="text-sm font-medium text-muted-foreground">Evidence</Label>
                                                <ul className="mt-2 space-y-1">
                                                    {diagnosis.rootCause.evidence_summary.map((item, index) => (
                                                        <li key={index} className="text-sm flex items-start gap-2">
                                                            <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Resolution Plan */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.9 }}
                            >
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <CheckCircle className="w-5 h-5" />
                                            Resolution Plan
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-sm font-medium text-muted-foreground">Estimated Time</Label>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                                    <span className="text-sm">{diagnosis.resolution.estimated_time || '—'}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <Label className="text-sm font-medium text-muted-foreground">Escalation</Label>
                                                <div className="mt-1">
                                                    {diagnosis.resolution.escalate ? (
                                                        <Badge variant="destructive" className="gap-1">
                                                            <AlertTriangle className="w-3 h-3" />
                                                            Yes → {diagnosis.resolution.escalate_to || 'L3 team'}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary">No</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Escalation Details */}
                                        {diagnosis.resolution.escalate && (
                                            <EscalationDetails 
                                                module={diagnosis.parsed.module}
                                                escalateTo={diagnosis.resolution.escalate_to}
                                                escalateReason={diagnosis.resolution.escalate_reason}
                                            />
                                        )}

                                        {diagnosis.resolution.resolution_steps?.length > 0 && (
                                            <div>
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-sm font-medium text-muted-foreground">Resolution Steps</Label>
                                                    {diagnosis.resolution.time_breakdown?.resolution_steps_time && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {diagnosis.resolution.time_breakdown.resolution_steps_time}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <ol className="mt-2 space-y-2">
                                                    {diagnosis.resolution.resolution_steps.map((step, index) => (
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

                                        {diagnosis.resolution.verification_steps?.length > 0 && (
                                            <div>
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-sm font-medium text-muted-foreground">Verification Steps</Label>
                                                    {diagnosis.resolution.time_breakdown?.verification_steps_time && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {diagnosis.resolution.time_breakdown.verification_steps_time}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <ul className="mt-2 space-y-1">
                                                    {diagnosis.resolution.verification_steps.map((step, index) => (
                                                        <li key={index} className="text-sm flex items-start gap-2">
                                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                                                            {step}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {diagnosis.resolution.sql_queries?.length > 0 && (
                                            <div>
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-sm font-medium text-muted-foreground">SQL / Commands</Label>
                                                    {diagnosis.resolution.time_breakdown?.sql_commands_time && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {diagnosis.resolution.time_breakdown.sql_commands_time}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <pre className="mt-2 p-3 bg-muted rounded-md text-xs font-mono overflow-x-auto">
                                                    {diagnosis.resolution.sql_queries.join('\n\n')}
                                                </pre>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Confidence Assessment */}
                            {diagnosis.confidenceAssessment && diagnosis.confidenceAssessment.overall_score !== undefined && (
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 1.1 }}
                                >
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
                                            <div className="space-y-6">
                                                {/* Overall Score */}
                                                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                                    <div>
                                                        <Label className="text-sm font-medium text-muted-foreground">Overall Confidence Score</Label>
                                                        <p className="text-3xl font-bold mt-1">{diagnosis.confidenceAssessment.overall_score}%</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <Badge
                                                            variant="outline"
                                                            className={`text-sm ${getConfidenceBadgeClass(diagnosis.confidenceAssessment.interpretation?.recommendation?.split(' ').pop())}`}
                                                        >
                                                            {diagnosis.confidenceAssessment.interpretation?.recommendation || 'N/A'}
                                                        </Badge>
                                                        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                                                            {diagnosis.confidenceAssessment.interpretation?.recommendation_detail || ''}
                                                        </p>
                                                    </div>
                                                </div>

                                                <Separator />

                                                {/* Evidence Breakdown */}
                                                {diagnosis.confidenceAssessment.breakdown && (
                                                    <div>
                                                        <Label className="text-base font-semibold mb-4 block">Evidence Quality Breakdown</Label>
                                                        <div className="space-y-4">
                                                            {/* Log Evidence */}
                                                            <div className="space-y-2">
                                                                <div className="flex items-center justify-between">
                                                                    <Label className="text-sm font-medium">Application Logs</Label>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-sm text-muted-foreground">
                                                                            {diagnosis.confidenceAssessment.breakdown.log_evidence.percentage}%
                                                                        </span>
                                                                        <Badge variant="outline" className="text-xs">
                                                                            {diagnosis.confidenceAssessment.breakdown.log_evidence.status}
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                                <Progress
                                                                    value={diagnosis.confidenceAssessment.breakdown.log_evidence.percentage}
                                                                    className="h-2"
                                                                />
                                                            </div>

                                                            {/* Past Cases */}
                                                            <div className="space-y-2">
                                                                <div className="flex items-center justify-between">
                                                                    <Label className="text-sm font-medium">Similar Past Cases</Label>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-sm text-muted-foreground">
                                                                            {diagnosis.confidenceAssessment.breakdown.past_cases.percentage}%
                                                                        </span>
                                                                        <Badge variant="outline" className="text-xs">
                                                                            {diagnosis.confidenceAssessment.breakdown.past_cases.status}
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                                <Progress
                                                                    value={diagnosis.confidenceAssessment.breakdown.past_cases.percentage}
                                                                    className="h-2"
                                                                />
                                                            </div>

                                                            {/* Knowledge Base */}
                                                            <div className="space-y-2">
                                                                <div className="flex items-center justify-between">
                                                                    <Label className="text-sm font-medium">Knowledge Base</Label>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-sm text-muted-foreground">
                                                                            {diagnosis.confidenceAssessment.breakdown.knowledge_base.percentage}%
                                                                        </span>
                                                                        <Badge variant="outline" className="text-xs">
                                                                            {diagnosis.confidenceAssessment.breakdown.knowledge_base.status}
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                                <Progress
                                                                    value={diagnosis.confidenceAssessment.breakdown.knowledge_base.percentage}
                                                                    className="h-2"
                                                                />
                                                            </div>

                                                            {/* Identifiers */}
                                                            <div className="space-y-2">
                                                                <div className="flex items-center justify-between">
                                                                    <Label className="text-sm font-medium">Specific Identifiers</Label>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-sm text-muted-foreground">
                                                                            {diagnosis.confidenceAssessment.breakdown.identifiers.percentage}%
                                                                        </span>
                                                                        <Badge variant="outline" className="text-xs">
                                                                            {diagnosis.confidenceAssessment.breakdown.identifiers.status}
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                                <Progress
                                                                    value={diagnosis.confidenceAssessment.breakdown.identifiers.percentage}
                                                                    className="h-2"
                                                                />
                                                            </div>

                                                            {/* Evidence Quality */}
                                                            {diagnosis.confidenceAssessment.breakdown.evidence_quality && (
                                                                <div className="space-y-2">
                                                                    <div className="flex items-center justify-between">
                                                                        <Label className="text-sm font-medium">Evidence Quality</Label>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-sm text-muted-foreground">
                                                                                {diagnosis.confidenceAssessment.breakdown.evidence_quality.percentage}%
                                                                            </span>
                                                                            <Badge variant="outline" className="text-xs">
                                                                                {diagnosis.confidenceAssessment.breakdown.evidence_quality.status}
                                                                            </Badge>
                                                                        </div>
                                                                    </div>
                                                                    <Progress
                                                                        value={diagnosis.confidenceAssessment.breakdown.evidence_quality.percentage}
                                                                        className="h-2"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                <Separator />

                                                {/* Interpretation */}
                                                {diagnosis.confidenceAssessment.interpretation && (
                                                    <div className="space-y-4">
                                                        <Label className="text-base font-semibold block">Interpretation</Label>

                                                        {/* Diagnosis Confidence */}
                                                        <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <Label className="text-sm font-medium">Diagnosis Confidence</Label>
                                                                <Badge
                                                                    variant="outline"
                                                                    className={getConfidenceBadgeClass(diagnosis.confidenceAssessment.interpretation.diagnosis_confidence)}
                                                                >
                                                                    {diagnosis.confidenceAssessment.interpretation.diagnosis_confidence}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground">
                                                                {diagnosis.confidenceAssessment.interpretation.diagnosis_explanation}
                                                            </p>
                                                        </div>

                                                        {/* Solution Confidence */}
                                                        <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <Label className="text-sm font-medium">Solution Confidence</Label>
                                                                <Badge
                                                                    variant="outline"
                                                                    className={getConfidenceBadgeClass(diagnosis.confidenceAssessment.interpretation.solution_confidence)}
                                                                >
                                                                    {diagnosis.confidenceAssessment.interpretation.solution_confidence}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground">
                                                                {diagnosis.confidenceAssessment.interpretation.solution_explanation}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}

                            {/* Full Report */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 1.3 }}
                            >
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
                                                {diagnosis.report}
                                            </ReactMarkdown>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
