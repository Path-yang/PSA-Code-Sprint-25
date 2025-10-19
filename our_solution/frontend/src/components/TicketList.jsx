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
  List,
  Trash2,
  Loader2
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

const TicketCard = memo(({ ticket, onSelectTicket }) => {
  const parsedData = ticket.diagnosis_data?.parsed || {};
  const priority = parsedData.priority || 'Medium';
  const module = parsedData.module || 'N/A';
  const ticketId = parsedData.ticket_id || `#${ticket.ticket_number}`;

  return (
    <Card
      className="bg-background/50 backdrop-blur-sm border border-border/50 cursor-pointer hover:bg-muted/30 hover:shadow-lg transition-all duration-200 hover:border-primary/50 h-full"
      onClick={() => onSelectTicket(ticket.id)}
    >
      <CardHeader className="pb-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm font-medium">{ticketId}</span>
          <Badge variant={ticket.status === 'active' ? 'default' : 'secondary'}>
            {ticket.status}
          </Badge>
        </div>
        <CardTitle className="text-sm font-medium line-clamp-2">
          <Badge variant={
            priority === 'High' ? 'destructive' :
              priority === 'Medium' ? 'warning' :
                'success'
          }>
            {priority}
          </Badge>
        </CardTitle>
        <CardDescription className="text-xs line-clamp-2">
          {module}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            {getChannelIcon(parsedData.channel)}
            <span>{parsedData.channel} • {formatDuration(ticket.created_at, ticket.closed_at)}</span>
          </div>
          <div className="flex items-center gap-1">
            {ticket.status === 'closed' ? (
              <>
                <CheckCircle className="w-3 h-3" />
                <span>{formatDate(ticket.closed_at)}</span>
              </>
            ) : (
              <>
                <Calendar className="w-3 h-3" />
                <span>{formatDate(ticket.created_at)}</span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

function renderTicketCard(ticket, index, onSelectTicket) {
  return <TicketCard key={ticket.id} ticket={ticket} onSelectTicket={onSelectTicket} />;
}

function renderTicketTableRow(ticket, index, onSelectTicket) {
  const parsedData = ticket.diagnosis_data?.parsed || {};
  const priority = parsedData.priority || 'Medium';
  const module = parsedData.module || 'N/A';
  const ticketId = parsedData.ticket_id || `#${ticket.ticket_number}`;

  return (
    <TableRow
      key={ticket.id}
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => onSelectTicket(ticket.id)}
    >
      <TableCell className="font-mono font-medium">{ticketId}</TableCell>
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
          <div className="font-medium">
            <Badge variant={
              priority === 'High' ? 'destructive' :
                priority === 'Medium' ? 'warning' :
                  'success'
            }>
              {priority}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground line-clamp-1">{module}</div>
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

  // Optimistic update handler for ticket status changes
  const handleTicketUpdate = useCallback((ticketId, updates) => {
    setAllTickets(prevTickets => {
      const updatedTickets = prevTickets.map(ticket =>
        ticket.id === ticketId ? { ...ticket, ...updates } : ticket
      );
      // Update cache immediately for instant feel
      sessionStorage.setItem('cachedTickets', JSON.stringify(updatedTickets));
      return updatedTickets;
    });
  }, []);

  // Optimistic delete handler
  const handleTicketDelete = useCallback((ticketId) => {
    setAllTickets(prevTickets => {
      const updatedTickets = prevTickets.filter(ticket => ticket.id !== ticketId);
      // Update cache immediately
      sessionStorage.setItem('cachedTickets', JSON.stringify(updatedTickets));
      return updatedTickets;
    });
  }, []);

  const loadAllTickets = useCallback(async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) {
      setLoading(true);
    }
    setError('');
    try {
      // Load all tickets (no status filter)
      const fetchedTickets = await listTickets();
      setAllTickets(fetchedTickets);
      // Cache for next time
      sessionStorage.setItem('cachedTickets', JSON.stringify(fetchedTickets));
    } catch (err) {
      setError(err.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cache tickets in sessionStorage for instant loading
  useEffect(() => {
    // Try to load from cache immediately
    const cachedTickets = sessionStorage.getItem('cachedTickets');
    if (cachedTickets) {
      try {
        const parsed = JSON.parse(cachedTickets);
        setAllTickets(parsed);
        // Don't show loading spinner since we have cached data
        loadAllTickets(false);
        return;
      } catch (e) {
        // Invalid cache, ignore and fetch normally
      }
    }

    // No cache, fetch with loading spinner
    loadAllTickets(true);
  }, [loadAllTickets]);

  useEffect(() => {
    localStorage.setItem('ticketViewMode', viewMode);
  }, [viewMode]);

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
            <Button variant="outline" className="gap-2 hover:bg-white hover:text-black">
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
          <ToggleGroupItem value="card" aria-label="Card view" className="gap-2 hover:bg-gray-100 hover:text-black data-[state=on]:bg-white data-[state=on]:text-black transition-all duration-200">
            <Grid3X3 className="w-4 h-4" />
            Cards
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="List view" className="gap-2 hover:bg-gray-100 hover:text-black data-[state=on]:bg-white data-[state=on]:text-black transition-all duration-200">
            <List className="w-4 h-4" />
            List
          </ToggleGroupItem>
        </ToggleGroup>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active" className="gap-2">
            <AlertCircle className="w-4 h-4" />
            Active Tickets
            <Badge variant="secondary" className="ml-2 bg-white text-black border border-gray-200">
              {allTickets.filter(t => t.status === 'active').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="closed" className="gap-2">
            <CheckCircle className="w-4 h-4" />
            Closed Tickets
            <Badge variant="secondary" className="ml-2 bg-white text-black border border-gray-200">
              {allTickets.filter(t => t.status === 'closed').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="deleted" className="gap-2">
            <Trash2 className="w-4 h-4" />
            Deleted Tickets
            <Badge variant="secondary" className="ml-2 bg-white text-black border border-gray-200">
              {allTickets.filter(t => t.status === 'deleted').length}
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
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Loading Tickets</h3>
                <p className="text-sm text-muted-foreground">Fetching your diagnostic tickets...</p>
              </div>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12">
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
            </div>
          ) : viewMode === 'list' ? (
            <div>
              {renderTicketsTable(filteredTickets, onSelectTicket)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTickets.map((ticket, index) => renderTicketCard(ticket, index, onSelectTicket))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="closed" className="mt-6">
          {/* Same content structure for closed tickets */}
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Loading Tickets</h3>
                <p className="text-sm text-muted-foreground">Fetching your diagnostic tickets...</p>
              </div>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No closed tickets</h3>
              <p className="text-muted-foreground">
                Closed tickets will appear here once they are resolved
              </p>
            </div>
          ) : viewMode === 'list' ? (
            <div>
              {renderTicketsTable(filteredTickets, onSelectTicket)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTickets.map((ticket, index) => renderTicketCard(ticket, index, onSelectTicket))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="deleted" className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Loading Tickets</h3>
                <p className="text-sm text-muted-foreground">Fetching your diagnostic tickets...</p>
              </div>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Deleted Tickets</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'Try adjusting your search terms' : 'Deleted tickets will appear here'}
              </p>
            </div>
          ) : viewMode === 'list' ? (
            <div>
              {renderTicketsTable(filteredTickets, onSelectTicket)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTickets.map((ticket, index) => renderTicketCard(ticket, index, onSelectTicket))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}