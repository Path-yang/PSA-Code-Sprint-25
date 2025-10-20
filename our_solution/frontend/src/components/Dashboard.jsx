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
    Calendar as CalendarIcon,
    Clock,
    Loader2,
    Download,
    FileDown,
    FileSpreadsheet,
    X,
    RefreshCw
} from 'lucide-react';
import LandingPage from './LandingPage';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Toaster } from './ui/sonner';
import { toast } from 'sonner';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, Label } from 'recharts';
import { listTickets, createTicket, getTicket } from '../api.js';
import { TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';
import { HoverBorderGradient } from './ui/hover-border-gradient';
import { TooltipProvider } from './ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
    const [previousTicketTab, setPreviousTicketTab] = useState('active'); // Remember which tab user was on
    const [ticketFilters, setTicketFilters] = useState(null); // Store filters from analytics

    // Force light mode - always remove dark class
    useEffect(() => {
        document.documentElement.classList.remove('dark');
        // Clear any saved dark mode preference
        localStorage.removeItem('darkMode');
    }, []);

    // Listen for navigation events from analytics charts
    useEffect(() => {
        const handleNavigateTickets = (event) => {
            const { filterType, filterValue } = event.detail;
            setTicketFilters({ [filterType]: filterValue });
            setPreviousTicketTab('active'); // Reset to active tab when navigating from analytics
            setActiveView('tickets');
        };

        const handleNavigate = (event) => {
            const view = event.detail;
            setActiveView(view);
        };

        window.addEventListener('navigate-tickets', handleNavigateTickets);
        window.addEventListener('navigate', handleNavigate);

        return () => {
            window.removeEventListener('navigate-tickets', handleNavigateTickets);
            window.removeEventListener('navigate', handleNavigate);
        };
    }, []);

    const handleViewChange = (view) => {
        setActiveView(view);
        setSelectedTicketId(null);
        // Reset filters when manually navigating
        if (view !== 'tickets') {
            setTicketFilters(null);
        }
        // Reset ticket created state and diagnosis when navigating to diagnose page from another page
        if (view === 'diagnose' && activeView !== 'diagnose') {
            setTicketCreated(false);
            setDiagnosis(null); // Clear diagnosis to hide "Save as Ticket" button
        }
        // Reset previous ticket tab to 'active' when navigating away from tickets
        // This ensures tickets page always opens to Active Tickets by default
        if (view !== 'tickets' && view !== 'ticket-detail') {
            setPreviousTicketTab('active');
        }
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

    const handleTicketSelect = async (ticketId, currentTab) => {
        setPreviousTicketTab(currentTab); // Remember which tab they were on
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
        // previousTicketTab will be used by TicketList to restore the correct tab
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
                return <TicketList
                    onSelectTicket={handleTicketSelect}
                    onBackToDiagnose={handleBackToDiagnose}
                    refreshKey={ticketRefreshKey}
                    initialTab={previousTicketTab}
                    initialFilters={ticketFilters}
                    onFiltersCleared={() => setTicketFilters(null)}
                />;
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
                                        {isSavingTicket ? 'Creating your ticket...' : 'Save as Ticket'}
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

// Format number for display
const formatNumber = (num) => {
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
};

// Real analytics component with actual data
function AnalyticsView() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [metrics, setMetrics] = useState({
        total: 0,
        active: 0,
        closed: 0,
        escalated: 0,
        resolutionRate: 0,
        avgResolutionTime: 0,
        weekChange: { total: 0, resolutionTime: 0 }
    });
    const [chartData, setChartData] = useState([]);
    const [statusDistribution, setStatusDistribution] = useState([]);
    const [priorityBreakdown, setPriorityBreakdown] = useState([]);
    const [alertTypeData, setAlertTypeData] = useState([]);

    // Time period state
    const [timePeriod, setTimePeriod] = useState('7D');
    const [customDateRange, setCustomDateRange] = useState({ from: null, to: null });
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Filter state
    const [filters, setFilters] = useState({
        status: 'all',
        priority: 'all',
        module: 'all'
    });

    useEffect(() => {
        loadAnalytics();
    }, [timePeriod, customDateRange, filters]);

    const getDateRange = () => {
        const now = new Date();
        let startDate;

        if (timePeriod === 'Custom' && customDateRange.from && customDateRange.to) {
            return { start: customDateRange.from, end: customDateRange.to };
        }

        switch (timePeriod) {
            case '7D':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '14D':
                startDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
                break;
            case '30D':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        return { start: startDate, end: now };
    };

    const loadAnalytics = async () => {
        setLoading(true);
        setError('');
        try {
            const fetchedTickets = await listTickets();
            // Exclude deleted tickets from analytics
            let allTickets = fetchedTickets.filter(t => t.status !== 'deleted');

            // Apply filters
            if (filters.status !== 'all') {
                allTickets = allTickets.filter(t => t.status === filters.status);
            }
            if (filters.priority !== 'all') {
                allTickets = allTickets.filter(t => {
                    const priority = t.diagnosis_data?.parsed?.priority;
                    return priority === filters.priority;
                });
            }
            if (filters.module !== 'all') {
                allTickets = allTickets.filter(t => {
                    const module = t.diagnosis_data?.parsed?.module;
                    return module === filters.module;
                });
            }

            // Filter by date range
            const { start, end } = getDateRange();
            allTickets = allTickets.filter(t => {
                const created = new Date(t.created_at);
                return created >= start && created <= end;
            });

            setTickets(allTickets);

            // Calculate metrics (excluding deleted tickets)
            const total = allTickets.length;
            const active = allTickets.filter(t => t.status === 'active').length;
            const closed = allTickets.filter(t => t.status === 'closed').length;
            const escalated = allTickets.filter(t => t.diagnosis_data?.parsed?.escalation_needed === 'Yes').length;
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
                escalated,
                resolutionRate,
                avgResolutionTime,
                weekChange: {
                    total: currentWeekTickets.length - previousWeekTickets.length,
                    resolutionTime: currentWeekAvgTime - previousWeekAvgTime
                }
            });

            // Status distribution for donut chart
            setStatusDistribution([
                { name: 'Active', value: active, color: 'hsl(var(--primary))' },
                { name: 'Closed', value: closed, color: 'hsl(var(--muted-foreground))' }
            ]);

            // Priority breakdown
            const highPriority = allTickets.filter(t => t.diagnosis_data?.parsed?.priority === 'High').length;
            const mediumPriority = allTickets.filter(t => t.diagnosis_data?.parsed?.priority === 'Medium').length;
            const lowPriority = allTickets.filter(t => t.diagnosis_data?.parsed?.priority === 'Low').length;

            setPriorityBreakdown([
                { priority: 'High', count: highPriority, percentage: total > 0 ? (highPriority / total * 100).toFixed(1) : 0 },
                { priority: 'Medium', count: mediumPriority, percentage: total > 0 ? (mediumPriority / total * 100).toFixed(1) : 0 },
                { priority: 'Low', count: lowPriority, percentage: total > 0 ? (lowPriority / total * 100).toFixed(1) : 0 }
            ]);

            // Alert type analysis (top 5)
            const alertTypes = {};
            allTickets.forEach(ticket => {
                const alertType = ticket.diagnosis_data?.parsed?.alert_type ||
                    ticket.diagnosis_data?.parsed?.module ||
                    'Unknown';
                alertTypes[alertType] = (alertTypes[alertType] || 0) + 1;
            });

            const sortedAlertTypes = Object.entries(alertTypes)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([type, count]) => ({ type, count }));

            setAlertTypeData(sortedAlertTypes);

            // Prepare chart data based on time period
            const days = timePeriod === '30D' ? 30 : timePeriod === '14D' ? 14 : 7;
            const chartData = [];
            for (let i = days - 1; i >= 0; i--) {
                const date = new Date(end.getTime() - i * 24 * 60 * 60 * 1000);
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
                    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
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

    // Export functions
    const exportToCSV = () => {
        try {
            const headers = ['Date', 'Active Tickets', 'Closed Tickets', 'Avg Resolution Time (h)'];
            const csvData = chartData.map(row => [
                row.date,
                row.active,
                row.closed,
                row.avgTime
            ]);

            // Add summary metrics at the top
            const summaryRows = [
                ['Metrics Summary'],
                ['Total Tickets', metrics.total],
                ['Active Tickets', metrics.active],
                ['Closed Tickets', metrics.closed],
                ['Resolution Rate (%)', metrics.resolutionRate.toFixed(1)],
                ['Avg Resolution Time (h)', metrics.avgResolutionTime.toFixed(1)],
                [],
                headers,
                ...csvData
            ];

            const csvContent = summaryRows.map(row => row.join(',')).join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `analytics_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('CSV exported successfully!');
        } catch (error) {
            toast.error('Failed to export CSV');
            console.error('CSV export error:', error);
        }
    };

    const exportToPDF = async () => {
        try {
            toast.info('Generating PDF...');
            const element = document.getElementById('analytics-content');
            if (!element) {
                toast.error('Analytics content not found');
                return;
            }

            const canvas = await html2canvas(element, {
                scale: 2,
                logging: false,
                useCORS: true
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`analytics_report_${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success('PDF exported successfully!');
        } catch (error) {
            toast.error('Failed to export PDF');
            console.error('PDF export error:', error);
        }
    };

    // Navigate to tickets page with filters
    const navigateToTicketsWithFilter = (filterType, filterValue) => {
        // This will be passed to parent Dashboard to navigate to tickets with filters
        window.dispatchEvent(new CustomEvent('navigate-tickets', {
            detail: { filterType, filterValue }
        }));
    };

    const clearFilters = () => {
        setFilters({
            status: 'all',
            priority: 'all',
            module: 'all'
        });
    };

    const activeFilterCount = Object.values(filters).filter(v => v !== 'all').length;

    // Get unique modules for filter
    const uniqueModules = [...new Set(tickets.map(t => t.diagnosis_data?.parsed?.module).filter(Boolean))];

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

    const hasData = metrics.total > 0;

    return (
        <TooltipProvider>
            <div className="p-6 space-y-6">
                {/* Header Controls */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div className="flex flex-wrap gap-2 items-center">
                        {/* Time Period Selector */}
                        <Select value={timePeriod} onValueChange={setTimePeriod}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Time Period" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7D">Last 7 Days</SelectItem>
                                <SelectItem value="14D">Last 14 Days</SelectItem>
                                <SelectItem value="30D">Last 30 Days</SelectItem>
                                <SelectItem value="Custom">Custom Range</SelectItem>
                            </SelectContent>
                        </Select>

                        {timePeriod === 'Custom' && (
                            <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="gap-2">
                                        <CalendarIcon className="w-4 h-4" />
                                        {customDateRange.from && customDateRange.to
                                            ? `${customDateRange.from.toLocaleDateString()} - ${customDateRange.to.toLocaleDateString()}`
                                            : 'Select dates'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <div className="p-4 space-y-4">
                                        <div>
                                            <p className="text-sm font-medium mb-2">From Date</p>
                                            <Calendar
                                                selected={customDateRange.from}
                                                onSelect={(date) => setCustomDateRange(prev => ({ ...prev, from: date }))}
                                            />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium mb-2">To Date</p>
                                            <Calendar
                                                selected={customDateRange.to}
                                                onSelect={(date) => setCustomDateRange(prev => ({ ...prev, to: date }))}
                                            />
                                        </div>
                                        <Button onClick={() => setShowDatePicker(false)} className="w-full">
                                            Apply
                                        </Button>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        )}

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={loadAnalytics}
                            title="Refresh data"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Export Buttons */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <Download className="w-4 h-4" />
                                Export
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={exportToCSV}>
                                <FileSpreadsheet className="w-4 h-4 mr-2" />
                                Export as CSV
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={exportToPDF}>
                                <FileDown className="w-4 h-4 mr-2" />
                                Export as PDF
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Filters Bar */}
                <Card className="p-4">
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Filters:</span>
                            {activeFilterCount > 0 && (
                                <Badge variant="secondary">{activeFilterCount} active</Badge>
                            )}
                        </div>

                        <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filters.priority} onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Priority</SelectItem>
                                <SelectItem value="High">High</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="Low">Low</SelectItem>
                            </SelectContent>
                        </Select>

                        {uniqueModules.length > 0 && (
                            <Select value={filters.module} onValueChange={(value) => setFilters(prev => ({ ...prev, module: value }))}>
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue placeholder="Module" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Modules</SelectItem>
                                    {uniqueModules.map(module => (
                                        <SelectItem key={module} value={module}>{module}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {activeFilterCount > 0 && (
                            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
                                <X className="w-3 h-3" />
                                Clear filters
                            </Button>
                        )}
                    </div>
                </Card>

                <div id="analytics-content" className="space-y-6">
                    {!hasData ? (
                        <Card className="p-12">
                            <CardContent className="text-center">
                                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                                <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    There are no tickets in the selected time period.
                                </p>
                                <Button variant="outline" onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'diagnose' }))}>
                                    Create Your First Ticket
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {/* Metrics Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <Card className="glass-metric">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{metrics.total}</div>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
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
                                        <CardTitle className="text-sm font-medium">Active Tickets</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{metrics.active}</div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {metrics.total > 0 ? ((metrics.active / metrics.total) * 100).toFixed(1) : 0}% of total
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="glass-metric">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{metrics.closed}</div>
                                        <p className="text-xs text-muted-foreground mt-1">
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
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
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

                            {/* Charts Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Ticket Trends Chart */}
                                <Card className="glass-card">
                                    <CardHeader>
                                        <div>
                                            <CardTitle className="text-lg">Ticket Trends</CardTitle>
                                            <CardDescription>Active vs closed tickets over time</CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={350}>
                                            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                                <XAxis
                                                    dataKey="date"
                                                    stroke="hsl(var(--muted-foreground))"
                                                    fontSize={12}
                                                    label={{ value: 'Date', position: 'insideBottom', offset: -5 }}
                                                />
                                                <YAxis
                                                    stroke="hsl(var(--muted-foreground))"
                                                    fontSize={12}
                                                    label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
                                                />
                                                <RechartsTooltip
                                                    contentStyle={{
                                                        backgroundColor: 'hsl(var(--popover))',
                                                        border: '1px solid hsl(var(--border))',
                                                        borderRadius: '6px'
                                                    }}
                                                />
                                                <Legend
                                                    verticalAlign="bottom"
                                                    height={24}
                                                    wrapperStyle={{ paddingTop: '30px' }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="active"
                                                    stackId="1"
                                                    stroke="hsl(var(--primary))"
                                                    fill="hsl(var(--primary) / 0.2)"
                                                    name="Active"
                                                    onClick={(data) => navigateToTicketsWithFilter('status', 'active')}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="closed"
                                                    stackId="1"
                                                    stroke="hsl(var(--muted-foreground))"
                                                    fill="hsl(var(--muted-foreground) / 0.2)"
                                                    name="Closed"
                                                    onClick={(data) => navigateToTicketsWithFilter('status', 'closed')}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>

                                {/* Status Distribution Donut Chart */}
                                <Card className="glass-card">
                                    <CardHeader>
                                        <div>
                                            <CardTitle className="text-lg">Status Distribution</CardTitle>
                                            <CardDescription>Breakdown of ticket statuses</CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={statusDistribution}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={100}
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                    onClick={(data) => navigateToTicketsWithFilter('status', data.name.toLowerCase())}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    {statusDistribution.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                    <Label
                                                        value={metrics.total}
                                                        position="center"
                                                        style={{
                                                            fontSize: '24px',
                                                            fontWeight: 'bold',
                                                            fill: 'hsl(var(--foreground))'
                                                        }}
                                                    />
                                                </Pie>
                                                <RechartsTooltip
                                                    contentStyle={{
                                                        backgroundColor: 'hsl(var(--popover))',
                                                        border: '1px solid hsl(var(--border))',
                                                        borderRadius: '6px'
                                                    }}
                                                    formatter={(value) => [`${value} tickets`, 'Count']}
                                                />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>

                                {/* Priority Breakdown Chart */}
                                <Card className="glass-card">
                                    <CardHeader>
                                        <div>
                                            <CardTitle className="text-lg">Priority Breakdown</CardTitle>
                                            <CardDescription>Tickets by priority level</CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={priorityBreakdown}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                                <XAxis
                                                    dataKey="priority"
                                                    stroke="hsl(var(--muted-foreground))"
                                                    fontSize={12}
                                                />
                                                <YAxis
                                                    stroke="hsl(var(--muted-foreground))"
                                                    fontSize={12}
                                                    label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
                                                />
                                                <RechartsTooltip
                                                    contentStyle={{
                                                        backgroundColor: 'hsl(var(--popover))',
                                                        border: '1px solid hsl(var(--border))',
                                                        borderRadius: '6px'
                                                    }}
                                                    formatter={(value, name, props) => [
                                                        `${value} tickets (${props.payload.percentage}%)`,
                                                        'Count'
                                                    ]}
                                                />
                                                <Bar
                                                    dataKey="count"
                                                    fill="hsl(var(--primary))"
                                                    onClick={(data) => navigateToTicketsWithFilter('priority', data.priority)}
                                                    style={{ cursor: 'pointer' }}
                                                    radius={[4, 4, 0, 0]}
                                                >
                                                    {priorityBreakdown.map((entry, index) => {
                                                        const colors = {
                                                            High: 'hsl(var(--destructive))',
                                                            Medium: 'hsl(var(--warning))',
                                                            Low: 'hsl(var(--success))'
                                                        };
                                                        return <Cell key={`cell-${index}`} fill={colors[entry.priority] || 'hsl(var(--primary))'} />;
                                                    })}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>

                                {/* Alert Type Analysis Chart */}
                                <Card className="glass-card">
                                    <CardHeader>
                                        <div>
                                            <CardTitle className="text-lg">Top Alert Types</CardTitle>
                                            <CardDescription>Most common alert categories</CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {alertTypeData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart data={alertTypeData} layout="vertical">
                                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                                    <XAxis
                                                        type="number"
                                                        stroke="hsl(var(--muted-foreground))"
                                                        fontSize={12}
                                                    />
                                                    <YAxis
                                                        dataKey="type"
                                                        type="category"
                                                        width={120}
                                                        stroke="hsl(var(--muted-foreground))"
                                                        fontSize={12}
                                                    />
                                                    <RechartsTooltip
                                                        contentStyle={{
                                                            backgroundColor: 'hsl(var(--popover))',
                                                            border: '1px solid hsl(var(--border))',
                                                            borderRadius: '6px'
                                                        }}
                                                        formatter={(value) => [`${value} tickets`, 'Count']}
                                                    />
                                                    <Bar
                                                        dataKey="count"
                                                        fill="hsl(var(--primary))"
                                                        radius={[0, 4, 4, 0]}
                                                        style={{ cursor: 'pointer' }}
                                                    />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                                <p>No alert type data available</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Resolution Times Chart */}
                                <Card className="glass-card lg:col-span-2">
                                    <CardHeader>
                                        <div>
                                            <CardTitle className="text-lg">Resolution Times</CardTitle>
                                            <CardDescription>Average resolution time per day</CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={350}>
                                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                                <XAxis
                                                    dataKey="date"
                                                    stroke="hsl(var(--muted-foreground))"
                                                    fontSize={12}
                                                    label={{ value: 'Date', position: 'insideBottom', offset: -5 }}
                                                />
                                                <YAxis
                                                    stroke="hsl(var(--muted-foreground))"
                                                    fontSize={12}
                                                    label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
                                                />
                                                <RechartsTooltip
                                                    contentStyle={{
                                                        backgroundColor: 'hsl(var(--popover))',
                                                        border: '1px solid hsl(var(--border))',
                                                        borderRadius: '6px'
                                                    }}
                                                    formatter={(value) => [`${value}h`, 'Avg Time']}
                                                />
                                                <Legend
                                                    verticalAlign="bottom"
                                                    height={24}
                                                    wrapperStyle={{ paddingTop: '30px' }}
                                                />
                                                <Bar
                                                    dataKey="avgTime"
                                                    fill="hsl(var(--primary))"
                                                    name="Avg Resolution Time (hours)"
                                                    radius={[4, 4, 0, 0]}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </TooltipProvider>
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
