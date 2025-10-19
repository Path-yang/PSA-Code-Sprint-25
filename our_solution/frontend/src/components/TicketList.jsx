import { useState, useEffect, useMemo, useCallback, memo } from 'react';
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
  Search,
  Grid3X3,
  List
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Skeleton } from './ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
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

function renderTicketCard(ticket, index, onSelectTicket) {
  const parsedData = ticket.diagnosis_data?.parsed || {};
  const alertSummary = ticket.alert_text.split('\n')[0].substring(0, 80);

  return (
    <motion.div
      key={ticket.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
      className="h-full"
    >
      <Card
        className="glass-card cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-primary/50 h-full flex flex-col"
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
          <CardTitle className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">
            {parsedData.alert_type || 'Unknown Alert'}
          </CardTitle>
          <CardDescription className="text-xs line-clamp-2 min-h-[2rem]">
            {alertSummary}...
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 flex-1">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {getChannelIcon(parsedData.channel)}
              <span>{parsedData.channel || 'Unknown'}</span>
              <span>•</span>
              <Clock className="w-3 h-3" />
              <span>{formatDuration(ticket.created_at, ticket.closed_at)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>Opened: {formatDate(ticket.created_at)}</span>
            </div>
            {ticket.status === 'closed' && ticket.closed_at && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle className="w-3 h-3" />
                <span>Closed: {formatDate(ticket.closed_at)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function renderTicketTableRow(ticket, index, onSelectTicket) {
  const parsedData = ticket.diagnosis_data?.parsed || {};
  const alertSummary = ticket.alert_text.split('\n')[0].substring(0, 80);

  return (
    <TableRow
      key={ticket.id}
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => onSelectTicket(ticket.id)}
    >
      <TableCell className="font-mono font-medium">#{ticket.id}</TableCell>
      <TableCell>
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
      </TableCell>
      <TableCell>
        <div className="max-w-md">
          <div className="font-medium">{parsedData.alert_type || 'Unknown Alert'}</div>
          <div className="text-xs text-muted-foreground line-clamp-1">{alertSummary}...</div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          {getChannelIcon(parsedData.channel)}
          <span className="text-sm">{parsedData.channel || 'Unknown'}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-muted-foreground" />
          <span className="text-sm">{formatDuration(ticket.created_at, ticket.closed_at)}</span>
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>Opened: {formatDate(ticket.created_at)}</span>
          </div>
          {ticket.status === 'closed' && ticket.closed_at && (
            <div className="flex items-center gap-1 text-xs">
              <CheckCircle className="w-3 h-3" />
              <span>Closed: {formatDate(ticket.closed_at)}</span>
            </div>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

function renderTicketsTable(tickets, onSelectTicket) {
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Ticket ID</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead>Alert & Description</TableHead>
            <TableHead className="w-[120px]">Channel</TableHead>
            <TableHead className="w-[120px]">Duration</TableHead>
            <TableHead className="w-[180px]">Timeline</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence>
            {tickets.map((ticket, index) => renderTicketTableRow(ticket, index, onSelectTicket))}
          </AnimatePresence>
        </TableBody>
      </Table>
    </div>
  );
}

export default function TicketList({ onSelectTicket, onBackToDiagnose }) {
  const [activeTab, setActiveTab] = useState('active');
  const [allTickets, setAllTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('ticketViewMode') || 'card');
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    loadAllTickets();
  }, []);

  useEffect(() => {
    localStorage.setItem('ticketViewMode', viewMode);
  }, [viewMode]);

  const loadAllTickets = useCallback(async () => {
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
  }, []);

  // Memoize filtered tickets for better performance
  const filteredTickets = useMemo(() => {
    const ticketsForCurrentTab = allTickets.filter(ticket => ticket.status === activeTab);
    
    return ticketsForCurrentTab.filter(ticket => {
      const parsedData = ticket.diagnosis_data?.parsed || {};

      // Search filter
      const matchesSearch = searchQuery === '' ||
        ticket.alert_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.id.toString().includes(searchQuery) ||
        (parsedData.ticket_id || '').toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter (additional to active tab)
      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;

      // Channel filter
      const matchesChannel = channelFilter === 'all' || parsedData.channel === channelFilter;

      // Date filter
      const matchesDate = (() => {
        if (dateFilter === 'all') return true;
        const ticketDate = new Date(ticket.created_at);
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        switch (dateFilter) {
          case 'today': return ticketDate >= oneDayAgo;
          case 'week': return ticketDate >= oneWeekAgo;
          case 'month': return ticketDate >= oneMonthAgo;
          default: return true;
        }
      })();

      return matchesSearch && matchesStatus && matchesChannel && matchesDate;
    });
  }, [allTickets, activeTab, searchQuery, statusFilter, channelFilter, dateFilter]);

  return (
    <div className="p-6 space-y-6">
      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Filter by Channel</DropdownMenuLabel>
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Channels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="Email">Email</SelectItem>
                <SelectItem value="SMS">SMS</SelectItem>
                <SelectItem value="Phone">Phone</SelectItem>
              </SelectContent>
            </Select>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Filter by Date</DropdownMenuLabel>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </DropdownMenuContent>
        </DropdownMenu>
        <ToggleGroup type="single" value={viewMode} onValueChange={setViewMode} className="border rounded-md">
          <ToggleGroupItem value="card" aria-label="Card view" className="gap-2">
            <Grid3X3 className="w-4 h-4" />
            Cards
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="List view" className="gap-2">
            <List className="w-4 h-4" />
            List
          </ToggleGroupItem>
        </ToggleGroup>
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
          ) : viewMode === 'list' ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {renderTicketsTable(filteredTickets, onSelectTicket)}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <AnimatePresence>
                {filteredTickets.map((ticket, index) => renderTicketCard(ticket, index, onSelectTicket))}
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
          ) : viewMode === 'list' ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {renderTicketsTable(filteredTickets, onSelectTicket)}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <AnimatePresence>
                {filteredTickets.map((ticket, index) => renderTicketCard(ticket, index, onSelectTicket))}
              </AnimatePresence>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}