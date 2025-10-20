import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    AlertTriangle,
    BarChart3,
    FileText,
    Home,
    Settings,
    Ticket,
    Zap,
    ChevronLeft,
    ChevronRight,
    ArrowLeft,
    Calendar,
    Clock,
    Loader2
} from 'lucide-react';
import LandingPage from './LandingPage';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Toaster } from './ui/sonner';
import { toast } from 'sonner';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { listTickets, createTicket, getTicket } from '../api.js';
import { TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';
import { HoverBorderGradient } from './ui/hover-border-gradient';

// Import existing components
import DiagnosticForm from './DiagnosticForm';
import TicketList from './TicketList';
import TicketDetail from './TicketDetail';

const sidebarItems = [
    { id: 'home', label: 'Home', icon: Home, description: 'Landing page' },
    { id: 'diagnose', label: 'Diagnose', icon: Zap, description: 'Run diagnostics' },
    { id: 'tickets', label: 'Tickets', icon: Ticket, description: 'Manage tickets' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'View insights' },
    { id: 'settings', label: 'Settings', icon: Settings, description: 'Configuration' },
];

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

export default function Dashboard() {
    const [activeView, setActiveView] = useState('home');
    const [selectedTicketId, setSelectedTicketId] = useState(null);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [diagnosis, setDiagnosis] = useState(null);
    const [ticketCreated, setTicketCreated] = useState(false);
    const [isSavingTicket, setIsSavingTicket] = useState(false);
    const [ticketRefreshKey, setTicketRefreshKey] = useState(0); // Trigger ticket list refresh

    // Force light mode - always remove dark class
    useEffect(() => {
        document.documentElement.classList.remove('dark');
        // Clear any saved dark mode preference
        localStorage.removeItem('darkMode');
    }, []);

    const handleViewChange = (view) => {
        setActiveView(view);
        setSelectedTicketId(null);
    };

    const handleCreateTicket = async () => {
        if (!diagnosis || isSavingTicket) return;

        setIsSavingTicket(true);
        try {
            // Get the alert text from the diagnosis or use a default
            const alertText = diagnosis.parsed?.alert_type || 'Diagnostic Alert';
            await createTicket(alertText, diagnosis);
            setTicketCreated(true);
            toast.success('Ticket created successfully!');
        } catch (error) {
            toast.error('Failed to create ticket');
            console.error('Ticket creation error:', error);
        } finally {
            setIsSavingTicket(false);
        }
    };

    const handleTicketSelect = async (ticketId) => {
        setSelectedTicketId(ticketId);
        setSelectedTicket(null); // Clear old ticket data to prevent showing wrong ID during loading
        setActiveView('ticket-detail');
        try {
            const ticket = await getTicket(ticketId);
            setSelectedTicket(ticket);
        } catch (error) {
            console.error('Failed to fetch ticket:', error);
            toast.error('Failed to load ticket details');
        }
    };

    const handleBackToTickets = () => {
        setActiveView('tickets');
        setSelectedTicketId(null);
        setSelectedTicket(null);
    };

    const handleBackToDiagnose = () => {
        setActiveView('diagnose');
        setSelectedTicketId(null);
    };

    const renderContent = () => {
        switch (activeView) {
            case 'home':
                return <LandingPage onNavigate={setActiveView} />;
            case 'diagnose':
                return <DiagnosticForm
                    onTicketCreated={() => toast.success('Ticket created successfully!')}
                    onDiagnosisChange={setDiagnosis}
                    onTicketCreatedChange={setTicketCreated}
                />;
            case 'tickets':
                return <TicketList onSelectTicket={handleTicketSelect} onBackToDiagnose={handleBackToDiagnose} refreshKey={ticketRefreshKey} />;
            case 'ticket-detail':
                return selectedTicketId ? (
                    <TicketDetail
                        ticketId={selectedTicketId}
                        ticket={selectedTicket}
                        onBack={handleBackToTickets}
                        onTicketUpdated={() => {
                            setTicketRefreshKey(prev => prev + 1); // Trigger ticket list refresh
                            toast.success('Ticket updated!');
                        }}
                    />
                ) : null;
            case 'analytics':
                return <AnalyticsView />;
            case 'settings':
                return <SettingsView />;
            default:
                return <LandingPage onNavigate={setActiveView} />;
        }
    };

    return (
        <div className="flex h-screen bg-background">
            <Toaster />

            {/* Sidebar */}
            <motion.div
                className={`glass-nav border-r-[3px] border-border/80 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'
                    }`}
                initial={false}
                animate={{ width: sidebarCollapsed ? 64 : 256, transition: { duration: 0.3 } }}
            >
                {/* Header */}
                <div className={`border-b border-border ${sidebarCollapsed ? 'p-2' : 'p-6'}`}>
                    <button
                        onClick={() => setActiveView('home')}
                        className="flex items-center justify-center w-full hover:opacity-80 transition-opacity"
                    >
                        {sidebarCollapsed ? (
                            <div className="w-full flex flex-col items-center justify-center">
                                <img
                                    src="/PSA-Logo.png"
                                    alt="PSA Logo"
                                    className="h-10 w-10 object-contain"
                                />
                                <p className="text-xs font-bold mt-1">PSA</p>
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ delay: sidebarCollapsed ? 0 : 0.3, duration: 0.2 }}
                                className="flex flex-col items-center w-full"
                            >
                                <div className="flex items-center gap-3">
                                    <img
                                        src="/PSA-Logo.png"
                                        alt="PSA Logo"
                                        className="h-12 w-auto object-contain"
                                    />
                                    <span className="text-2xl font-bold">PSA</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">L2 Diagnostic Assistant</p>
                            </motion.div>
                        )}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    {sidebarItems.map((item, index) => {
                        const Icon = item.icon;
                        // Highlight 'tickets' nav when viewing ticket detail
                        const isActive = activeView === item.id || (activeView === 'ticket-detail' && item.id === 'tickets');

                        return (
                            <div key={item.id}>
                                <Button
                                    variant={isActive ? "default" : "ghost"}
                                    className={`w-full justify-start gap-3 ${sidebarCollapsed ? 'px-2' : 'px-3'}`}
                                    onClick={() => handleViewChange(item.id)}
                                >
                                    <Icon className="w-4 h-4 flex-shrink-0" />
                                    {!sidebarCollapsed && (
                                        <motion.div
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            transition={{ delay: sidebarCollapsed ? 0 : 0.3, duration: 0.2 }}
                                            className="flex flex-col items-start"
                                        >
                                            <span className={`text-sm font-medium ${isActive ? 'text-primary-foreground' : 'text-foreground'}`}>
                                                {item.label}
                                            </span>
                                        </motion.div>
                                    )}
                                </Button>
                                {index < sidebarItems.length - 1 && (
                                    <div className="h-px bg-border mx-2 my-2" />
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-border">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className={`w-full gap-2 ${sidebarCollapsed ? 'justify-center' : 'justify-start'}`}
                    >
                        {sidebarCollapsed ? (
                            <ChevronRight className="w-4 h-4" />
                        ) : (
                            <ChevronLeft className="w-4 h-4" />
                        )}
                        {!sidebarCollapsed && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ delay: sidebarCollapsed ? 0 : 0.3, duration: 0.15 }}
                            >
                                Collapse
                            </motion.span>
                        )}
                    </Button>
                </div>
            </motion.div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar */}
                <div className="glass-header px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div>
                                <div className="flex items-center gap-3">
                                    <h2 className="text-xl font-semibold capitalize">
                                        {activeView === 'home' ? 'Welcome' :
                                            activeView === 'ticket-detail' ?
                                                (selectedTicket?.diagnosis_data?.parsed?.ticket_id
                                                    ? `Ticket ${selectedTicket.diagnosis_data.parsed.ticket_id}`
                                                    : 'Ticket Details') :
                                                activeView.replace('-', ' ')}
                                    </h2>
                                    {activeView === 'ticket-detail' && selectedTicket && (
                                        <Badge
                                            variant={selectedTicket.status === 'active' ? 'default' : selectedTicket.status === 'closed' ? 'secondary' : 'destructive'}
                                            className="gap-1"
                                        >
                                            <AlertTriangle className="w-3 h-3" />
                                            {selectedTicket.status}
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {activeView === 'home' && 'PSA L2 Diagnostic Assistant'}
                                    {activeView === 'diagnose' && 'Run diagnostics on alerts and generate resolution plans'}
                                    {activeView === 'tickets' && 'Manage and track diagnostic tickets'}
                                    {activeView === 'ticket-detail' && 'View and edit ticket details'}
                                    {activeView === 'analytics' && 'View diagnostic insights and metrics'}
                                    {activeView === 'settings' && 'Configure diagnostic settings'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {activeView === 'diagnose' && diagnosis && !ticketCreated && (
                                <HoverBorderGradient
                                    onClick={isSavingTicket ? undefined : handleCreateTicket}
                                    duration={1}
                                    clockwise={true}
                                    containerClassName="h-10 w-auto"
                                    className={`bg-primary text-primary-foreground ${isSavingTicket ? 'opacity-60 cursor-not-allowed' : ''}`}
                                >
                                    <div className="flex items-center gap-2">
                                        {isSavingTicket ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <CheckCircle className="w-4 h-4" />
                                        )}
                                        {isSavingTicket ? 'Saving...' : 'Save as Ticket'}
                                    </div>
                                </HoverBorderGradient>
                            )}
                            {activeView === 'diagnose' && ticketCreated && (
                                <div className="flex items-center justify-center w-10 h-10 text-green-600 bg-green-50 dark:bg-green-900/20 rounded-full border border-green-200 dark:border-green-800">
                                    <CheckCircle className="w-5 h-5" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeView}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                            className="h-full"
                        >
                            {renderContent()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

// Real analytics component with actual data
function AnalyticsView() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [metrics, setMetrics] = useState({
        total: 0,
        active: 0,
        closed: 0,
        resolutionRate: 0,
        avgResolutionTime: 0,
        weekChange: { total: 0, resolutionTime: 0 }
    });
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        setLoading(true);
        setError('');
        try {
            const fetchedTickets = await listTickets();
            // Exclude deleted tickets from analytics
            const allTickets = fetchedTickets.filter(t => t.status !== 'deleted');
            setTickets(allTickets);

            // Calculate metrics (excluding deleted tickets)
            const total = allTickets.length;
            const active = allTickets.filter(t => t.status === 'active').length;
            const closed = allTickets.filter(t => t.status === 'closed').length;
            const resolutionRate = total > 0 ? (closed / total * 100) : 0;

            // Calculate average resolution time for closed tickets
            const closedTickets = allTickets.filter(t => t.status === 'closed' && t.closed_at);
            const avgResolutionTime = closedTickets.length > 0
                ? closedTickets.reduce((sum, ticket) => {
                    const created = new Date(ticket.created_at);
                    const closed = new Date(ticket.closed_at);
                    return sum + (closed - created) / (1000 * 60 * 60); // Convert to hours
                }, 0) / closedTickets.length
                : 0;

            // Calculate week-over-week changes
            const now = new Date();
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

            const currentWeekTickets = allTickets.filter(t => new Date(t.created_at) >= oneWeekAgo);
            const previousWeekTickets = allTickets.filter(t => {
                const created = new Date(t.created_at);
                return created >= twoWeeksAgo && created < oneWeekAgo;
            });

            const currentWeekClosed = currentWeekTickets.filter(t => t.status === 'closed' && t.closed_at);
            const previousWeekClosed = previousWeekTickets.filter(t => t.status === 'closed' && t.closed_at);

            const currentWeekAvgTime = currentWeekClosed.length > 0
                ? currentWeekClosed.reduce((sum, ticket) => {
                    const created = new Date(ticket.created_at);
                    const closed = new Date(ticket.closed_at);
                    return sum + (closed - created) / (1000 * 60 * 60);
                }, 0) / currentWeekClosed.length
                : 0;

            const previousWeekAvgTime = previousWeekClosed.length > 0
                ? previousWeekClosed.reduce((sum, ticket) => {
                    const created = new Date(ticket.created_at);
                    const closed = new Date(ticket.closed_at);
                    return sum + (closed - created) / (1000 * 60 * 60);
                }, 0) / previousWeekClosed.length
                : 0;

            setMetrics({
                total,
                active,
                closed,
                resolutionRate,
                avgResolutionTime,
                weekChange: {
                    total: currentWeekTickets.length - previousWeekTickets.length,
                    resolutionTime: currentWeekAvgTime - previousWeekAvgTime
                }
            });

            // Prepare chart data for last 7 days
            const chartData = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

                const dayTickets = allTickets.filter(t => {
                    const created = new Date(t.created_at);
                    return created >= dayStart && created < dayEnd;
                });

                const dayClosed = dayTickets.filter(t => t.status === 'closed' && t.closed_at);
                const dayAvgTime = dayClosed.length > 0
                    ? dayClosed.reduce((sum, ticket) => {
                        const created = new Date(ticket.created_at);
                        const closed = new Date(ticket.closed_at);
                        return sum + (closed - created) / (1000 * 60 * 60);
                    }, 0) / dayClosed.length
                    : 0;

                chartData.push({
                    date: date.toLocaleDateString('en-US', { weekday: 'short' }),
                    active: dayTickets.filter(t => t.status === 'active').length,
                    closed: dayTickets.filter(t => t.status === 'closed').length,
                    avgTime: Math.round(dayAvgTime * 10) / 10
                });
            }

            setChartData(chartData);
        } catch (err) {
            setError(err.message || 'Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Loading Analytics</h3>
                    <p className="text-sm text-muted-foreground">Please wait while we gather your diagnostic insights...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center text-muted-foreground">
                            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                            <p>Failed to load analytics: {error}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="glass-metric">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.total}</div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {metrics.weekChange.total >= 0 ? (
                                <TrendingUp className="w-3 h-3 text-green-500" />
                            ) : (
                                <TrendingDown className="w-3 h-3 text-red-500" />
                            )}
                            <span className={metrics.weekChange.total >= 0 ? 'text-green-500' : 'text-red-500'}>
                                {metrics.weekChange.total >= 0 ? '+' : ''}{metrics.weekChange.total} from last week
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-metric">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.closed}</div>
                        <p className="text-xs text-muted-foreground">
                            {metrics.resolutionRate.toFixed(1)}% resolution rate
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass-metric">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Resolution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.avgResolutionTime.toFixed(1)}h</div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {metrics.weekChange.resolutionTime <= 0 ? (
                                <TrendingDown className="w-3 h-3 text-green-500" />
                            ) : (
                                <TrendingUp className="w-3 h-3 text-red-500" />
                            )}
                            <span className={metrics.weekChange.resolutionTime <= 0 ? 'text-green-500' : 'text-red-500'}>
                                {metrics.weekChange.resolutionTime <= 0 ? '' : '+'}{metrics.weekChange.resolutionTime.toFixed(1)}h from last week
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ticket Trends Chart */}
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="text-lg">Ticket Trends (7 Days)</CardTitle>
                        <CardDescription>Active vs closed tickets over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="active"
                                    stackId="1"
                                    stroke="hsl(var(--primary))"
                                    fill="hsl(var(--primary) / 0.2)"
                                    name="Active"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="closed"
                                    stackId="1"
                                    stroke="hsl(var(--muted-foreground))"
                                    fill="hsl(var(--muted-foreground) / 0.2)"
                                    name="Closed"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Resolution Times Chart */}
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="text-lg">Resolution Times</CardTitle>
                        <CardDescription>Average resolution time per day</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip formatter={(value) => [`${value}h`, 'Avg Time']} />
                                <Bar
                                    dataKey="avgTime"
                                    fill="hsl(var(--primary))"
                                    name="Avg Resolution Time (hours)"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function SettingsView() {
    return (
        <div className="p-6 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Settings
                    </CardTitle>
                    <CardDescription>Configure your diagnostic assistant</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Settings Placeholder */}
                    <div>
                        <h3 className="text-sm font-medium mb-2">Application Settings</h3>
                        <p className="text-sm text-muted-foreground">
                            Configuration options will be available soon.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
