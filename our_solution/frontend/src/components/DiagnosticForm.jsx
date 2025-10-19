import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap,
    FileText,
    Clock,
    CheckCircle,
    AlertTriangle,
    Loader2,
    Sparkles
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
            if (result.error) {
                throw new Error(result.error);
            }
            setDiagnosis(result);
        } catch (err) {
            setError(err.message || 'Diagnostics failed');
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

            {/* Floating Save Ticket Button */}
            {diagnosis && !ticketCreated && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-6 right-6 z-10"
                >
                    <button
                        onClick={handleCreateTicket}
                        disabled={loading}
                        className="group relative inline-flex h-10 items-center justify-center gap-2 overflow-hidden rounded-md bg-primary px-6 font-medium text-primary-foreground transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(100%)]">
                            <div className="relative h-full w-8 bg-white/20"></div>
                        </div>
                        <CheckCircle className="w-4 h-4" />
                        Save as Ticket
                    </button>
                </motion.div>
            )}

            {/* Success Message */}
            {ticketCreated && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-6 right-6 z-10"
                >
                    <div className="flex items-center gap-2 text-green-600 font-medium bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-md border border-green-200 dark:border-green-800">
                        <CheckCircle className="w-4 h-4" />
                        Ticket created!
                    </div>
                </motion.div>
            )}

            {/* Diagnostic Form */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Diagnostic Form
                        </CardTitle>
                        <CardDescription>
                            Paste your alert text below and let our AI analyze the issue
                        </CardDescription>
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

                            <Button type="submit" disabled={loading} className="w-full">
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Running diagnostics...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-4 h-4 mr-2" />
                                        Run Diagnostics
                                    </>
                                )}
                            </Button>

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
                {diagnosis && (
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

                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <Label className="text-sm font-medium">Confidence:</Label>
                                        <div className="flex items-center gap-2">
                                            <Progress value={diagnosis.rootCause.confidence} className="w-20" />
                                            <span className="text-sm font-medium">{diagnosis.rootCause.confidence}%</span>
                                        </div>
                                    </div>
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
                                        <Label className="text-sm font-medium text-muted-foreground">Resolution Steps</Label>
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
                                        <Label className="text-sm font-medium text-muted-foreground">Verification Steps</Label>
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
                                        <Label className="text-sm font-medium text-muted-foreground">SQL / Commands</Label>
                                        <pre className="mt-2 p-3 bg-muted rounded-md text-xs font-mono overflow-x-auto">
                                            {diagnosis.resolution.sql_queries.join('\n\n')}
                                        </pre>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

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
