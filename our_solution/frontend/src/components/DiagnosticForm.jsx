import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { HoverBorderGradient } from './ui/hover-border-gradient';
import { Button as StatefulButton } from './ui/stateful-button';
import { diagnoseAlert, createTicket } from '../api.js';

const placeholder = `Paste a ticket (email/SMS/call). Example:

RE: Email ALR-861600 | CMAU0000020 - Duplicate Container information received

Hi team,...`;

export default function DiagnosticForm({ onTicketCreated }) {
    const [alertText, setAlertText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [diagnosis, setDiagnosis] = useState(null);
    const [ticketCreated, setTicketCreated] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!alertText.trim()) {
            setError('Please paste an alert before running diagnostics.');
            return;
        }

        setLoading(true);
        setError('');
        setDiagnosis(null);
        setTicketCreated(false);

        try {
            const result = await diagnoseAlert(alertText.trim());
            console.log('API Response:', result);
            if (result.error) {
                throw new Error(result.error);
            }
            setDiagnosis(result);
        } catch (err) {
            console.error('Diagnosis error:', err);
            setError(err.message || 'Diagnostics failed');
            setDiagnosis(null);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTicket = async () => {
        if (!diagnosis || !alertText) return;

        setLoading(true);
        setError('');

        try {
            const ticket = await createTicket(alertText, diagnosis);
            setTicketCreated(true);
            onTicketCreated?.();
        } catch (err) {
            setError(err.message || 'Failed to create ticket');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6 relative">


            {/* Diagnostic Form */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Card>
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
                            {diagnosis && !ticketCreated && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <HoverBorderGradient
                                        onClick={handleCreateTicket}
                                        disabled={loading}
                                        duration={1}
                                        clockwise={true}
                                        containerClassName="h-10 w-auto"
                                        className="bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4" />
                                            Save as Ticket
                                        </div>
                                    </HoverBorderGradient>
                                </motion.div>
                            )}
                            {ticketCreated && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <div className="flex items-center gap-2 text-green-600 font-medium bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-md border border-green-200 dark:border-green-800">
                                        <CheckCircle className="w-4 h-4" />
                                        Ticket created!
                                    </div>
                                </motion.div>
                            )}
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
                                    className="min-h-[200px] font-mono text-sm"
                                />
                            </div>

                            <StatefulButton
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                                onClick={handleSubmit}
                            >
                                <div className="flex items-center gap-2">
                                    <Zap className="w-4 h-4" />
                                    Run Diagnostics
                                </div>
                            </StatefulButton>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-3 bg-destructive/10 border border-destructive/20 rounded-md"
                                >
                                    <div className="flex items-center gap-2 text-destructive">
                                        <AlertTriangle className="w-4 h-4" />
                                        {error}
                                    </div>
                                </motion.div>
                            )}
                        </form>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Diagnosis Results */}
            <AnimatePresence>
                {diagnosis && diagnosis.parsed && diagnosis.rootCause && diagnosis.resolution && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        {/* Ticket Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    Ticket Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-sm font-medium text-muted-foreground">Ticket ID</Label>
                                        <p className="font-mono text-sm">{diagnosis.parsed.ticket_id || '—'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-sm font-medium text-muted-foreground">Channel</Label>
                                        <Badge variant="outline">{diagnosis.parsed.channel || '—'}</Badge>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-sm font-medium text-muted-foreground">Module</Label>
                                        <p className="text-sm">{diagnosis.parsed.module || '—'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-sm font-medium text-muted-foreground">Priority</Label>
                                        <Badge variant={diagnosis.parsed.priority === 'High' ? 'destructive' : 'secondary'}>
                                            {diagnosis.parsed.priority || '—'}
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Root Cause Analysis */}
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

                        {/* Resolution Plan */}
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

                        {/* Confidence Assessment */}
                        {diagnosis.confidenceAssessment && diagnosis.confidenceAssessment.overall_score !== undefined && (
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
                                                    variant={
                                                        diagnosis.confidenceAssessment.overall_score >= 70 ? "default" :
                                                        diagnosis.confidenceAssessment.overall_score >= 50 ? "secondary" :
                                                        "destructive"
                                                    }
                                                    className="text-sm"
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
                                                                {diagnosis.confidenceAssessment.breakdown.log_evidence.score}/
                                                                {diagnosis.confidenceAssessment.breakdown.log_evidence.max_score} pts
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
                                                                {diagnosis.confidenceAssessment.breakdown.past_cases.score}/
                                                                {diagnosis.confidenceAssessment.breakdown.past_cases.max_score} pts
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
                                                                {diagnosis.confidenceAssessment.breakdown.knowledge_base.score}/
                                                                {diagnosis.confidenceAssessment.breakdown.knowledge_base.max_score} pts
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
                                                                {diagnosis.confidenceAssessment.breakdown.identifiers.score}/
                                                                {diagnosis.confidenceAssessment.breakdown.identifiers.max_score} pts
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
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-sm font-medium">Evidence Quality</Label>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm text-muted-foreground">
                                                                {diagnosis.confidenceAssessment.breakdown.evidence_quality.score}/
                                                                {diagnosis.confidenceAssessment.breakdown.evidence_quality.max_score} pts
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
                                                        variant={
                                                            diagnosis.confidenceAssessment.interpretation.diagnosis_confidence === "HIGH" ? "default" :
                                                            diagnosis.confidenceAssessment.interpretation.diagnosis_confidence === "MODERATE" ? "secondary" :
                                                            "destructive"
                                                        }
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
                                                        variant={
                                                            diagnosis.confidenceAssessment.interpretation.solution_confidence === "HIGH" ? "default" :
                                                            diagnosis.confidenceAssessment.interpretation.solution_confidence === "MODERATE" ? "secondary" :
                                                            "destructive"
                                                        }
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
                        )}

                        {/* Full Report */}
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
                )}
            </AnimatePresence>
        </div>
    );
}
