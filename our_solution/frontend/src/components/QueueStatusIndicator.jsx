import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Clock, Users, Activity, Loader2 } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export default function QueueStatusIndicator({ requestId, onStatusChange }) {
  const [queueStatus, setQueueStatus] = useState(null);
  const [requestStatus, setRequestStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let interval;

    const fetchStatus = async () => {
      try {
        // Fetch overall queue status
        const queueResponse = await fetch(`${BASE_URL}/api/queue/status`);
        if (queueResponse.ok) {
          const queueData = await queueResponse.json();
          setQueueStatus(queueData);
        }

        // Fetch specific request status if requestId provided
        if (requestId) {
          const requestResponse = await fetch(`${BASE_URL}/api/queue/request/${requestId}`);
          if (requestResponse.ok) {
            const requestData = await requestResponse.json();
            setRequestStatus(requestData);
            
            // Notify parent of status changes
            if (onStatusChange) {
              onStatusChange(requestData);
            }
            
            // Stop polling if completed or failed
            if (requestData.status === 'completed' || requestData.status === 'failed') {
              if (interval) {
                clearInterval(interval);
              }
            }
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching queue status:', error);
        setLoading(false);
      }
    };

    // Initial fetch
    fetchStatus();

    // Poll every 2 seconds for updates
    if (requestId) {
      interval = setInterval(fetchStatus, 2000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [requestId, onStatusChange]);

  if (loading && !queueStatus) {
    return null;
  }

  // Show global queue status (when no specific request)
  if (!requestId && queueStatus) {
    const { active_count, queue_length, is_busy, average_processing_time } = queueStatus;

    if (active_count === 0 && queue_length === 0) {
      return (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  System Ready
                </p>
                <p className="text-xs text-green-700 dark:text-green-300">
                  No diagnostics running
                </p>
              </div>
              <Badge variant="outline" className="border-green-300 text-green-700 dark:border-green-700 dark:text-green-300">
                <Activity className="w-3 h-3 mr-1" />
                Idle
              </Badge>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (is_busy) {
      return (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-yellow-600 animate-spin" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                  System Busy
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  {active_count} diagnostic{active_count > 1 ? 's' : ''} in progress
                  {queue_length > 0 && `, ${queue_length} waiting`}
                </p>
              </div>
              <Badge variant="outline" className="border-yellow-300 text-yellow-700 dark:border-yellow-700 dark:text-yellow-300">
                <Users className="w-3 h-3 mr-1" />
                {active_count} active
              </Badge>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Activity className="w-4 h-4 text-blue-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Processing
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {active_count} diagnostic{active_count > 1 ? 's' : ''} running
                {queue_length > 0 && `, ${queue_length} in queue`}
              </p>
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              ~{average_processing_time}s avg
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show specific request status
  if (requestId && requestStatus) {
    const { position, status, estimated_wait, processing_time, queue_status } = requestStatus;

    // Processing
    if (status === 'processing') {
      return (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  Processing Your Diagnosis
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Running AI analysis... {processing_time}s elapsed
                </p>
              </div>
            </div>
            <Progress value={Math.min((processing_time / 20) * 100, 95)} className="h-2" />
            {queue_status && queue_status.active_count > 1 && (
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Note: {queue_status.active_count - 1} other diagnosis running concurrently
              </p>
            )}
          </CardContent>
        </Card>
      );
    }

    // Queued
    if (status === 'queued' && position > 0) {
      const progressValue = estimated_wait > 0 ? Math.max(5, 100 - (estimated_wait / 60) * 100) : 0;
      
      return (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-orange-600" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                  In Queue - Position #{position}
                </p>
                <p className="text-xs text-orange-700 dark:text-orange-300">
                  Estimated wait: ~{estimated_wait} seconds
                </p>
              </div>
              <Badge variant="outline" className="border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-300">
                #{position}
              </Badge>
            </div>
            <Progress value={progressValue} className="h-2" />
            {queue_status && (
              <p className="text-xs text-orange-600 dark:text-orange-400">
                {queue_status.active_count} diagnostic{queue_status.active_count > 1 ? 's' : ''} currently running
              </p>
            )}
          </CardContent>
        </Card>
      );
    }

    // Completed
    if (status === 'completed') {
      return (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                  ✓ Diagnosis Complete
                </p>
                <p className="text-xs text-green-700 dark:text-green-300">
                  Completed in {processing_time}s
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Failed
    if (status === 'failed') {
      return (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <p className="text-sm font-semibold text-red-900 dark:text-red-100">
                ✗ Diagnosis Failed
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }
  }

  return null;
}

