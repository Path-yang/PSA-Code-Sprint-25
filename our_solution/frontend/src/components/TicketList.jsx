import { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
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

const TicketCard = memo(({ ticket, onSelectTicket, activeTab }) => {
  const parsedData = ticket.diagnosis_data?.parsed || {};
  const priority = parsedData.priority || 'Medium';
  const module = parsedData.module || 'N/A';
  const ticketId = parsedData.ticket_id || `#${ticket.ticket_number}`;

  return (
    <Card
      className="glass-card cursor-pointer hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 hover:border-primary/60 h-full group"
      onClick={() => onSelectTicket(ticket.id, activeTab)}
    >
      <CardHeader className="pb-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-base font-bold text-black dark:text-white drop-shadow-md">{ticketId}</span>
          <Badge
            variant={
              ticket.status === 'active' ? 'default' :
                ticket.status === 'closed' ? 'secondary' :
                  'destructive'
            }
            className="shadow-sm text-xs font-bold"
          >
            {ticket.status}
          </Badge>
        </div>
        <CardTitle className="text-sm font-medium line-clamp-2">
          <Badge variant={
            priority === 'High' ? 'destructive' :
              priority === 'Medium' ? 'warning' :
                'success'
          }
          className="shadow-sm font-bold text-xs">
            {priority}
          </Badge>
        </CardTitle>
        <CardDescription className="text-sm line-clamp-2 font-bold text-black dark:text-white drop-shadow-md">
          {module}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-xs text-black dark:text-white font-semibold">
          <div className="flex items-center gap-1 drop-shadow-md">
            {getChannelIcon(parsedData.channel)}
            <span>{parsedData.channel} • {formatDuration(ticket.created_at, ticket.closed_at)}</span>
          </div>
          <div className="flex flex-col items-end gap-1">
            {ticket.status === 'closed' && ticket.closed_at ? (
              <>
                <div className="flex items-center gap-1 drop-shadow-md">
                  <Calendar className="w-3 h-3" />
                  <span className="text-xs font-semibold">{formatDate(ticket.created_at)}</span>
                </div>
                <div className="flex items-center gap-1 drop-shadow-md">
                  <CheckCircle className="w-3 h-3" />
                  <span className="text-xs font-semibold">{formatDate(ticket.closed_at)}</span>
                </div>
              </>
            ) : ticket.status === 'deleted' && ticket.deleted_at ? (
              <>
                <div className="flex items-center gap-1 drop-shadow-md">
                  <Calendar className="w-3 h-3" />
                  <span className="text-xs font-semibold">{formatDate(ticket.created_at)}</span>
                </div>
                <div className="flex items-center gap-1 drop-shadow-md">
                  <Trash2 className="w-3 h-3" />
                  <span className="text-xs font-semibold">{formatDate(ticket.deleted_at)}</span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1 drop-shadow-md">
                <Calendar className="w-3 h-3" />
                <span className="text-xs font-semibold">{formatDate(ticket.created_at)}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

function renderTicketCard(ticket, index, onSelectTicket, activeTab) {
  return <TicketCard key={ticket.id} ticket={ticket} onSelectTicket={onSelectTicket} activeTab={activeTab} />;
}

function renderTicketTableRow(ticket, index, onSelectTicket, activeTab) {
  const parsedData = ticket.diagnosis_data?.parsed || {};
  const priority = parsedData.priority || 'Medium';
  const module = parsedData.module || 'N/A';
  const ticketId = parsedData.ticket_id || `#${ticket.ticket_number}`;

  return (
    <TableRow
      key={ticket.id}
      className="cursor-pointer border-b border-border/30 even:bg-foreground/5 hover:bg-foreground/10 backdrop-blur-sm hover:shadow-md transition-all duration-300 group"
      onClick={() => onSelectTicket(ticket.id, activeTab)}
    >
      <TableCell className="font-mono font-semibold py-4 text-foreground drop-shadow-sm">{ticketId}</TableCell>
      <TableCell className="py-4">
        <Badge
          variant={
            ticket.status === 'active' ? 'default' :
              ticket.status === 'closed' ? 'secondary' :
                'destructive'
          }
          className="gap-1 shadow-sm"
        >
          {ticket.status === 'active' ? (
            <AlertCircle className="w-3 h-3" />
          ) : ticket.status === 'closed' ? (
            <CheckCircle className="w-3 h-3" />
          ) : (
            <Trash2 className="w-3 h-3" />
          )}
          {ticket.status}
        </Badge>
      </TableCell>
      <TableCell className="py-4">
        <div className="flex items-center gap-2 max-w-md">
          <Badge variant={
            priority === 'High' ? 'destructive' :
              priority === 'Medium' ? 'warning' :
                'success'
          }
          className="shadow-sm font-semibold">
            {priority}
          </Badge>
          <span className="text-sm text-foreground/70 font-medium line-clamp-1 drop-shadow-sm">{module}</span>
        </div>
      </TableCell>
      <TableCell className="py-4">
        <div className="flex items-center gap-1 text-foreground/70 font-medium drop-shadow-sm">
          {getChannelIcon(parsedData.channel)}
          <span className="text-sm">{parsedData.channel || 'Unknown'}</span>
        </div>
      </TableCell>
      <TableCell className="py-4">
        <div className="flex items-center gap-1 text-foreground/70 font-medium drop-shadow-sm">
          <Clock className="w-3 h-3" />
          <span className="text-sm">{formatDuration(ticket.created_at, ticket.closed_at)}</span>
        </div>
      </TableCell>
      <TableCell className="text-sm text-foreground/70 font-medium py-4 drop-shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span className="text-xs">{formatDate(ticket.created_at)}</span>
          </div>
          {ticket.status === 'closed' && ticket.closed_at && (
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              <span className="text-xs">{formatDate(ticket.closed_at)}</span>
            </div>
          )}
          {ticket.status === 'deleted' && ticket.deleted_at && (
            <div className="flex items-center gap-1">
              <Trash2 className="w-3 h-3" />
              <span className="text-xs">{formatDate(ticket.deleted_at)}</span>
            </div>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

function renderTicketsTable(tickets, onSelectTicket, activeTab) {
  const getDateHeaderLabel = () => {
    if (activeTab === 'deleted') return 'Created / Deleted';
    if (activeTab === 'closed') return 'Created / Closed';
    return 'Created';
  };

  return (
    <div className="glass-card rounded-lg shadow-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-b-2 border-border/60 bg-foreground/5 backdrop-blur-sm">
            <TableHead className="w-[140px] font-bold text-foreground drop-shadow-sm">Ticket ID</TableHead>
            <TableHead className="w-[100px] font-bold text-foreground drop-shadow-sm">Status</TableHead>
            <TableHead className="min-w-[120px] font-bold text-foreground drop-shadow-sm">Priority / Module</TableHead>
            <TableHead className="w-[100px] font-bold text-foreground drop-shadow-sm">Channel</TableHead>
            <TableHead className="w-[130px] font-bold text-foreground drop-shadow-sm">Duration</TableHead>
            <TableHead className="w-[200px] font-bold text-foreground drop-shadow-sm">{getDateHeaderLabel()}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence>
            {tickets.map((ticket, index) => renderTicketTableRow(ticket, index, onSelectTicket, activeTab))}
          </AnimatePresence>
        </TableBody>
      </Table>
    </div>
  );
}

export default function TicketList({ onSelectTicket, onBackToDiagnose, refreshKey, initialTab = 'active', initialFilters = null, onFiltersCleared }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [allTickets, setAllTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('ticketViewMode') || 'card');
  const [statusFilter, setStatusFilter] = useState(initialFilters?.status || 'all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState(initialFilters?.priority || 'all');
  const [isRefreshing, setIsRefreshing] = useState(false); // Loading indicator for refresh (for create/close/delete)
  const [isWarmLoading, setIsWarmLoading] = useState(false); // Short overlay when cache exists but network fetch is pending
  const [hasAnalyticsFilters, setHasAnalyticsFilters] = useState(false);

  // Track previous refreshKey to detect actual changes
  const prevRefreshKeyRef = useRef(refreshKey);

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

  const loadAllTickets = useCallback(async (showLoadingSpinner = true, silent = false) => {
    if (showLoadingSpinner && !silent) {
      setLoading(true);
    }
    setError('');
    try {
      // Load all tickets (no status filter)
      const fetchedTickets = await listTickets();
      setAllTickets(fetchedTickets);
      // Cache for next time
      sessionStorage.setItem('cachedTickets', JSON.stringify(fetchedTickets));
      sessionStorage.setItem('cachedTicketsTimestamp', Date.now().toString());
    } catch (err) {
      if (!silent) {
        setError(err.message || 'Failed to load tickets');
      }
    } finally {
      if (showLoadingSpinner) {
        setLoading(false);
      }
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
        // Refresh silently without overlay when navigating back (no changes)
        loadAllTickets(false);
        return;
      } catch (e) {
        // Invalid cache, ignore and fetch normally
      }
    }

    // No cache, fetch with loading spinner
    loadAllTickets(true);
  }, [loadAllTickets]);

  // Handle initial filters from analytics
  useEffect(() => {
    if (initialFilters) {
      setHasAnalyticsFilters(true);
      if (initialFilters.status) {
        setStatusFilter(initialFilters.status);
        setActiveTab(initialFilters.status);
      }
      if (initialFilters.priority) {
        setPriorityFilter(initialFilters.priority);
      }
    }
  }, [initialFilters]);

  // Refresh tickets when refreshKey changes (e.g., after create/close/delete actions)
  useEffect(() => {
    // Only refresh if refreshKey actually changed (not on initial mount)
    if (refreshKey > 0 && refreshKey !== prevRefreshKeyRef.current) {
      setIsRefreshing(true);
      // Check cache age - if recent (< 5 seconds), do silent refresh
      const cachedTimestamp = sessionStorage.getItem('cachedTicketsTimestamp');
      const cacheAge = cachedTimestamp ? Date.now() - parseInt(cachedTimestamp) : Infinity;
      const useSilentRefresh = cacheAge < 5000; // Cache is fresh, refresh silently
      
      loadAllTickets(!useSilentRefresh, useSilentRefresh).finally(() => {
        setIsRefreshing(false);
      });
      // Update ref to current value
      prevRefreshKeyRef.current = refreshKey;
    }
  }, [refreshKey, loadAllTickets]);

  useEffect(() => {
    localStorage.setItem('ticketViewMode', viewMode);
  }, [viewMode]);

  // Clear analytics filters
  const handleClearAnalyticsFilters = () => {
    setHasAnalyticsFilters(false);
    setStatusFilter('all');
    setPriorityFilter('all');
    if (onFiltersCleared) {
      onFiltersCleared();
    }
  };

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

      // Priority filter
      const matchesPriority = priorityFilter === 'all' || parsedData.priority === priorityFilter;

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

      return matchesSearch && matchesStatus && matchesPriority && matchesChannel && matchesDate;
    });
  }, [allTickets, activeTab, searchQuery, statusFilter, priorityFilter, channelFilter, dateFilter]);

  return (
    <div className="px-3 md:px-6 py-2 md:py-4 space-y-3 md:space-y-4 relative overflow-hidden">
      {/* Background Image */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src="/pasir panjang port.jpeg"
          alt="Pasir Panjang Port - PSA Singapore"
          className="w-full h-full object-cover opacity-30 dark:opacity-20"
        />
        <div className="absolute inset-0 bg-white/30 dark:bg-black/30"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
      {/* No overlay when just navigating back; full-screen loading is handled by 'loading' state in each tab */}

      {/* Analytics Filter Banner */}
      {hasAnalyticsFilters && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Filters applied from Analytics</span>
            {statusFilter !== 'all' && (
              <Badge variant="secondary">Status: {statusFilter}</Badge>
            )}
            {priorityFilter !== 'all' && (
              <Badge variant="secondary">Priority: {priorityFilter}</Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAnalyticsFilters}
            className="gap-2"
          >
            Clear filters
          </Button>
        </motion.div>
      )}

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col sm:flex-row gap-2 md:gap-4"
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
            <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
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
        <ToggleGroup type="single" value={viewMode} onValueChange={setViewMode} className="border rounded-md w-full sm:w-auto">
          <ToggleGroupItem value="card" aria-label="Card view" className="gap-1 md:gap-2 hover:bg-gray-100 hover:text-black data-[state=on]:bg-white data-[state=on]:text-black transition-all duration-200 flex-1 sm:flex-none">
            <Grid3X3 className="w-4 h-4" />
            <span className="hidden sm:inline">Cards</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="List view" className="gap-1 md:gap-2 hover:bg-gray-100 hover:text-black data-[state=on]:bg-white data-[state=on]:text-black transition-all duration-200 flex-1 sm:flex-none">
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">List</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <AnimatePresence mode="wait">
          <div className="flex justify-center w-full">
            <TabsList className="inline-flex w-auto rounded-full">
              <TabsTrigger value="active" className="gap-2">
                <AlertCircle className="w-4 h-4" />
                Active Tickets
                {!loading && (
                  <Badge variant="secondary" className="ml-2 bg-white text-black border border-gray-200">
                    {allTickets.filter(t => t.status === 'active').length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="closed" className="gap-2">
                <CheckCircle className="w-4 h-4" />
                Closed Tickets
                {!loading && (
                  <Badge variant="secondary" className="ml-2 bg-white text-black border border-gray-200">
                    {allTickets.filter(t => t.status === 'closed').length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="deleted" className="gap-2">
                <Trash2 className="w-4 h-4" />
                Deleted Tickets
                {!loading && (
                  <Badge variant="secondary" className="ml-2 bg-white text-black border border-gray-200">
                    {allTickets.filter(t => t.status === 'deleted').length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="active" className="mt-6">
            <motion.div
              key="active"
              initial={{ y: 10 }}
              animate={{ y: 0 }}
              exit={{ y: -10 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
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
                <div className="overflow-x-auto -mx-3 md:mx-0 px-3 md:px-0">
                  {renderTicketsTable(filteredTickets, onSelectTicket, activeTab)}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {filteredTickets.map((ticket, index) => renderTicketCard(ticket, index, onSelectTicket, activeTab))}
                </div>
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="closed" className="mt-6">
            <motion.div
              key="closed"
              initial={{ y: 10 }}
              animate={{ y: 0 }}
              exit={{ y: -10 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
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
                <div className="overflow-x-auto -mx-3 md:mx-0 px-3 md:px-0">
                  {renderTicketsTable(filteredTickets, onSelectTicket, activeTab)}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {filteredTickets.map((ticket, index) => renderTicketCard(ticket, index, onSelectTicket, activeTab))}
                </div>
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="deleted" className="mt-6">
            <motion.div
              key="deleted"
              initial={{ y: 10 }}
              animate={{ y: 0 }}
              exit={{ y: -10 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
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
                <div className="overflow-x-auto -mx-3 md:mx-0 px-3 md:px-0">
                  {renderTicketsTable(filteredTickets, onSelectTicket, activeTab)}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {filteredTickets.map((ticket, index) => renderTicketCard(ticket, index, onSelectTicket, activeTab))}
                </div>
              )}
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
      </div>
    </div>
  );
}