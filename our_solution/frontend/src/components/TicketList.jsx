import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ticket,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
  Tag,
  Phone,
  Mail,
  MessageSquare,
  ArrowLeft,
  Filter,
  Search
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Skeleton } from './ui/skeleton';
import { listTickets } from '../api.js';

function formatDuration(created, closed) {
  const start = new Date(created);
  const end = closed ? new Date(closed) : new Date();
  const diffMs = end - start;

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }

  if (hours > 0) {
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  const minutes = Math.floor(diffMs / (1000 * 60));
  return `${minutes}m`;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getChannelIcon(channel) {
  switch (channel) {
    case 'Email': return <Mail className="w-3 h-3" />;
    case 'SMS': return <MessageSquare className="w-3 h-3" />;
    case 'Phone': return <Phone className="w-3 h-3" />;
    default: return <Ticket className="w-3 h-3" />;
  }
}

export default function TicketList({ onSelectTicket, onBackToDiagnose }) {
  const [activeTab, setActiveTab] = useState('active');
  const [allTickets, setAllTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAllTickets();
  }, []);

  const loadAllTickets = async () => {
    setLoading(true);
    setError('');
    try {
      // Load all tickets (no status filter)
      const fetchedTickets = await listTickets();
      setAllTickets(fetchedTickets);
    } catch (err) {
      setError(err.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  // Filter tickets by active tab and search query
  const ticketsForCurrentTab = allTickets.filter(ticket => ticket.status === activeTab);
  const filteredTickets = ticketsForCurrentTab.filter(ticket =>
    ticket.alert_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.id.toString().includes(searchQuery) ||
    (ticket.diagnosis_data?.parsed?.ticket_id || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="w-4 h-4" />
          Filter
        </Button>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active" className="gap-2">
            <AlertCircle className="w-4 h-4" />
            Active Tickets
            <Badge variant="secondary" className="ml-2">
              {allTickets.filter(t => t.status === 'active').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="closed" className="gap-2">
            <CheckCircle className="w-4 h-4" />
            Closed Tickets
            <Badge variant="secondary" className="ml-2">
              {allTickets.filter(t => t.status === 'closed').length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-destructive/10 border border-destructive/20 rounded-md"
            >
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            </motion.div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredTickets.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Ticket className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No tickets found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'Try adjusting your search terms' : 'Create a ticket from a diagnosis to get started'}
              </p>
              {!searchQuery && (
                <Button onClick={onBackToDiagnose} className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Go to Diagnostics
                </Button>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <AnimatePresence>
                {filteredTickets.map((ticket, index) => {
                  const parsedData = ticket.diagnosis_data?.parsed || {};
                  const alertSummary = ticket.alert_text.split('\n')[0].substring(0, 80);

                  return (
                    <motion.div
                      key={ticket.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card
                        className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/50"
                        onClick={() => onSelectTicket(ticket.id)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Ticket className="w-4 h-4 text-foreground" />
                              <span className="font-mono text-sm font-medium">#{ticket.id}</span>
                            </div>
                            <Badge
                              variant={ticket.status === 'active' ? 'default' : 'secondary'}
                              className="gap-1"
                            >
                              {ticket.status === 'active' ? (
                                <AlertCircle className="w-3 h-3" />
                              ) : (
                                <CheckCircle className="w-3 h-3" />
                              )}
                              {ticket.status}
                            </Badge>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-3">
                          <div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {alertSummary}...
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {parsedData.ticket_id && (
                              <Badge variant="outline" className="gap-1 text-xs">
                                <Tag className="w-3 h-3" />
                                {parsedData.ticket_id}
                              </Badge>
                            )}
                            {parsedData.module && (
                              <Badge variant="outline" className="gap-1 text-xs">
                                <Ticket className="w-3 h-3" />
                                {parsedData.module}
                              </Badge>
                            )}
                            {parsedData.channel && (
                              <Badge variant="outline" className="gap-1 text-xs">
                                {getChannelIcon(parsedData.channel)}
                                {parsedData.channel}
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {ticket.status === 'active' ? (
                                <span>Open for {formatDuration(ticket.created_at, null)}</span>
                              ) : (
                                <span>Resolved in {formatDuration(ticket.created_at, ticket.closed_at)}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(ticket.created_at)}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="closed" className="mt-6">
          {/* Same content structure for closed tickets */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredTickets.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No closed tickets</h3>
              <p className="text-muted-foreground">
                Closed tickets will appear here once they are resolved
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <AnimatePresence>
                {filteredTickets.map((ticket, index) => {
                  const parsedData = ticket.diagnosis_data?.parsed || {};
                  const alertSummary = ticket.alert_text.split('\n')[0].substring(0, 80);

                  return (
                    <motion.div
                      key={ticket.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card
                        className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/50"
                        onClick={() => onSelectTicket(ticket.id)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Ticket className="w-4 h-4 text-foreground" />
                              <span className="font-mono text-sm font-medium">#{ticket.id}</span>
                            </div>
                            <Badge variant="secondary" className="gap-1">
                              <CheckCircle className="w-3 h-3" />
                              {ticket.status}
                            </Badge>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-3">
                          <div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {alertSummary}...
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {parsedData.ticket_id && (
                              <Badge variant="outline" className="gap-1 text-xs">
                                <Tag className="w-3 h-3" />
                                {parsedData.ticket_id}
                              </Badge>
                            )}
                            {parsedData.module && (
                              <Badge variant="outline" className="gap-1 text-xs">
                                <Ticket className="w-3 h-3" />
                                {parsedData.module}
                              </Badge>
                            )}
                            {parsedData.channel && (
                              <Badge variant="outline" className="gap-1 text-xs">
                                {getChannelIcon(parsedData.channel)}
                                {parsedData.channel}
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Resolved in {formatDuration(ticket.created_at, ticket.closed_at)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(ticket.created_at)}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}