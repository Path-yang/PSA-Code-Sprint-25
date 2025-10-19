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
    Moon,
    Sun
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Toaster } from './ui/sonner';
import { toast } from 'sonner';

// Import existing components
import DiagnosticForm from './DiagnosticForm';
import TicketList from './TicketList';
import TicketDetail from './TicketDetail';

const sidebarItems = [
    { id: 'diagnose', label: 'Diagnose', icon: Zap, description: 'Run diagnostics' },
    { id: 'tickets', label: 'Tickets', icon: Ticket, description: 'Manage tickets' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'View insights' },
    { id: 'settings', label: 'Settings', icon: Settings, description: 'Configuration' },
];

export default function Dashboard() {
    const [activeView, setActiveView] = useState('diagnose');
    const [selectedTicketId, setSelectedTicketId] = useState(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        // Check localStorage for saved preference
        const saved = localStorage.getItem('darkMode');
        return saved ? JSON.parse(saved) : false;
    });

    // Apply dark mode on component mount
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const handleViewChange = (view) => {
        setActiveView(view);
        setSelectedTicketId(null);
    };

    const handleTicketSelect = (ticketId) => {
        setSelectedTicketId(ticketId);
        setActiveView('ticket-detail');
    };

    const handleBackToTickets = () => {
        setActiveView('tickets');
        setSelectedTicketId(null);
    };

    const handleBackToDiagnose = () => {
        setActiveView('diagnose');
        setSelectedTicketId(null);
    };

    const toggleDarkMode = () => {
        const newDarkMode = !isDarkMode;
        setIsDarkMode(newDarkMode);

        // Save to localStorage
        localStorage.setItem('darkMode', JSON.stringify(newDarkMode));

        // Apply dark mode class to document
        if (newDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const renderContent = () => {
        switch (activeView) {
            case 'diagnose':
                return <DiagnosticForm onTicketCreated={() => toast.success('Ticket created successfully!')} />;
            case 'tickets':
                return <TicketList onSelectTicket={handleTicketSelect} onBackToDiagnose={handleBackToDiagnose} />;
            case 'ticket-detail':
                return selectedTicketId ? (
                    <TicketDetail
                        ticketId={selectedTicketId}
                        onBack={handleBackToTickets}
                        onTicketUpdated={() => toast.success('Ticket updated!')}
                    />
                ) : null;
            case 'analytics':
                return <AnalyticsView />;
            case 'settings':
                return <SettingsView isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />;
            default:
                return <DiagnosticForm onTicketCreated={() => toast.success('Ticket created successfully!')} />;
        }
    };

    return (
        <div className="flex h-screen bg-background">
            <Toaster />

            {/* Sidebar */}
            <motion.div
                className={`bg-card border-r border-border flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'
                    }`}
                initial={false}
                animate={{ width: sidebarCollapsed ? 64 : 256, transition: { duration: 0.3 } }}
            >
                {/* Header */}
                <div className="p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                            <Activity className="w-5 h-5 text-foreground" />
                        </div>
                        {!sidebarCollapsed && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ delay: sidebarCollapsed ? 0 : 0.3, duration: 0.2 }}
                                className="flex flex-col"
                            >
                                <h1 className="text-lg font-semibold whitespace-nowrap">PSA Diagnostic</h1>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2">
                    {sidebarItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeView === item.id;

                        return (
                            <Button
                                key={item.id}
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
                                        <span className={`text-xs ${isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                            {item.description}
                                        </span>
                                    </motion.div>
                                )}
                            </Button>
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
                <div className="bg-card border-b border-border px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold capitalize">{activeView.replace('-', ' ')}</h2>
                            <p className="text-sm text-muted-foreground">
                                {activeView === 'diagnose' && 'Run diagnostics on alerts and generate resolution plans'}
                                {activeView === 'tickets' && 'Manage and track diagnostic tickets'}
                                {activeView === 'ticket-detail' && 'View and edit ticket details'}
                                {activeView === 'analytics' && 'View diagnostic insights and metrics'}
                                {activeView === 'settings' && 'Configure diagnostic settings'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                L2 Assistant
                            </Badge>
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

// Placeholder components for analytics and settings
function AnalyticsView() {
    return (
        <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">24</div>
                        <p className="text-xs text-muted-foreground">+2 from last week</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">18</div>
                        <p className="text-xs text-muted-foreground">75% resolution rate</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Resolution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">2.4h</div>
                        <p className="text-xs text-muted-foreground">-0.3h from last week</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function SettingsView({ isDarkMode, onToggleDarkMode }) {
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
                    {/* Dark Mode Toggle */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Label htmlFor="dark-mode" className="text-base font-medium">
                                Dark Mode
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Switch between light and dark themes
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Sun className="w-4 h-4 text-muted-foreground" />
                            <Switch
                                id="dark-mode"
                                checked={isDarkMode}
                                onCheckedChange={onToggleDarkMode}
                            />
                            <Moon className="w-4 h-4 text-muted-foreground" />
                        </div>
                    </div>

                    {/* Additional Settings Placeholder */}
                    <div className="pt-4 border-t">
                        <h3 className="text-sm font-medium mb-2">Additional Settings</h3>
                        <p className="text-sm text-muted-foreground">
                            More configuration options will be available soon.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
