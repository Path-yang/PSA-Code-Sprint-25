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
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            {/* Hero Section */}
            <section className="container mx-auto px-6 py-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center space-y-8"
                >
                    {/* Logo and Badge */}
                    <div className="flex justify-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4"
                        >
                            <Activity className="w-8 h-8 text-primary-foreground" />
                        </motion.div>
                    </div>

                    <Badge variant="secondary" className="gap-2 mb-4">
                        <Sparkles className="w-4 h-4" />
                        L2 Diagnostic Assistant
                    </Badge>

                    {/* Text Flip Animation */}
                    <div className="space-y-4">
                        <div className="mb-4">
                            <LayoutTextFlip />
                        </div>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="text-xl text-muted-foreground max-w-2xl mx-auto"
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
                </motion.div>
            </section>

            {/* Features Section - Aceternity Bento Grid */}
            <section className="container mx-auto px-6 py-12">
                <FeaturesSectionDemo />
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
