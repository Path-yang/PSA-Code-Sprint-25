import { motion } from 'framer-motion';
import { LayoutTextFlip } from './ui/layout-text-flip';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
    Zap,
    BarChart3,
    Ticket,
    Settings,
    ArrowRight,
    Activity,
    Brain,
    Shield,
    Sparkles
} from 'lucide-react';
import FeaturesSectionDemo from './features-section-demo-1';

export default function LandingPage({ onNavigate }) {
    const features = [
        {
            icon: Brain,
            title: "AI-Powered Diagnostics",
            description: "Advanced machine learning algorithms analyze alerts and provide intelligent root cause analysis",
            color: "text-blue-500"
        },
        {
            icon: BarChart3,
            title: "Real-time Analytics",
            description: "Comprehensive insights and metrics to track diagnostic performance and resolution times",
            color: "text-green-500"
        },
        {
            icon: Ticket,
            title: "Smart Ticket Management",
            description: "Automated ticket creation, tracking, and resolution with intelligent categorization",
            color: "text-purple-500"
        },
        {
            icon: Shield,
            title: "Automated Resolution",
            description: "AI-driven resolution plans with step-by-step guidance for faster problem solving",
            color: "text-orange-500"
        }
    ];

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative bg-white dark:bg-slate-900 overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="/PSA hero image.png"
                        alt="PSA Facility"
                        className="w-full h-full object-cover opacity-50"
                    />
                    {/* Dark Overlay */}
                    <div className="absolute inset-0 bg-black/5 dark:bg-black/10"></div>
                </div>

                <div className="container mx-auto px-6 py-20 relative z-10">
                    <motion.div
                        initial={{ y: 20 }}
                        animate={{ y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center"
                    >
                        {/* Glass Container */}
                        <div className="backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl max-w-4xl mx-auto space-y-6">
                            {/* Logo and Badge */}
                            <div className="flex flex-col items-center gap-4">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                    className="flex items-center gap-4"
                                >
                                    <img
                                        src="/PSA-Logo.png"
                                        alt="PSA Logo"
                                        className="h-20 w-auto object-contain"
                                    />
                                    <span className="text-5xl font-bold">PSA</span>
                                </motion.div>

                                <Badge variant="secondary" className="gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    L2 Diagnostic Assistant
                                </Badge>
                            </div>

                            {/* Text Flip Animation */}
                            <div className="space-y-3">
                                <div className="mb-4">
                                    <LayoutTextFlip />
                                </div>
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.8 }}
                                    className="text-xl text-black dark:text-white font-bold max-w-2xl mx-auto drop-shadow-lg"
                                >
                                    Transform your L2 support operations with AI-powered diagnostics,
                                    intelligent ticket management, and automated resolution workflows.
                                </motion.p>
                            </div>

                            {/* CTA Buttons */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1 }}
                                className="flex flex-col sm:flex-row gap-4 justify-center"
                            >
                                <Button
                                    size="lg"
                                    onClick={() => onNavigate('diagnose')}
                                    className="gap-2"
                                >
                                    Get Started <ArrowRight className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" size="lg" onClick={() => onNavigate('analytics')}>
                                    View Analytics
                                </Button>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section - Aceternity Bento Grid */}
            <section className="bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
                <div className="container mx-auto px-6 py-12">
                    <FeaturesSectionDemo />
                </div>
            </section>

            {/* Quick Actions Section */}
            <section className="container mx-auto px-6 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                    className="text-center mb-8"
                >
                    <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
                    <p className="text-muted-foreground">
                        Jump into the most common tasks and workflows
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="h-full"
                    >
                        <Card
                            className="glass-card cursor-pointer hover:shadow-lg transition-all duration-300 h-full flex flex-col"
                            onClick={() => onNavigate('diagnose')}
                        >
                            <CardContent className="p-6 text-center flex-1 flex flex-col justify-center">
                                <Zap className="w-8 h-8 mx-auto mb-3 text-primary" />
                                <h3 className="font-semibold mb-2">Run Diagnostics</h3>
                                <p className="text-sm text-muted-foreground">
                                    Analyze alerts and generate resolution plans
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="h-full"
                    >
                        <Card
                            className="glass-card cursor-pointer hover:shadow-lg transition-all duration-300 h-full flex flex-col"
                            onClick={() => onNavigate('tickets')}
                        >
                            <CardContent className="p-6 text-center flex-1 flex flex-col justify-center">
                                <Ticket className="w-8 h-8 mx-auto mb-3 text-primary" />
                                <h3 className="font-semibold mb-2">Manage Tickets</h3>
                                <p className="text-sm text-muted-foreground">
                                    View and track diagnostic tickets
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="h-full"
                    >
                        <Card
                            className="glass-card cursor-pointer hover:shadow-lg transition-all duration-300 h-full flex flex-col"
                            onClick={() => onNavigate('analytics')}
                        >
                            <CardContent className="p-6 text-center flex-1 flex flex-col justify-center">
                                <BarChart3 className="w-8 h-8 mx-auto mb-3 text-primary" />
                                <h3 className="font-semibold mb-2">View Analytics</h3>
                                <p className="text-sm text-muted-foreground">
                                    Insights and performance metrics
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </section>

        </div>
    );
}
