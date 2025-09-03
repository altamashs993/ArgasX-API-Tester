import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Trash2, Clock } from 'lucide-react';
import { RequestHistory } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface HistoryPanelProps {
  history: RequestHistory[];
  onHistoryItemSelect: (historyItem: RequestHistory) => void;
  onClearHistory: () => void;
}

const getMethodColor = (method: string) => {
  switch (method.toUpperCase()) {
    case 'GET': return 'bg-method-get';
    case 'POST': return 'bg-method-post';
    case 'PUT': return 'bg-method-put';
    case 'DELETE': return 'bg-method-delete';
    case 'PATCH': return 'bg-method-patch';
    default: return 'bg-muted';
  }
};

const getStatusColor = (status: number) => {
  if (status >= 200 && status < 300) return 'bg-status-success';
  if (status >= 400 && status < 500) return 'bg-status-client-error';
  if (status >= 500) return 'bg-status-server-error';
  return 'bg-muted';
};

export function HistoryPanel({
  history,
  onHistoryItemSelect,
  onClearHistory
}: HistoryPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = history.filter(item =>
    item.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.method.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">History</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearHistory}
            className="h-8 w-8 p-0"
            title="Clear History"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search history..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-auto p-4 space-y-2">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No history yet</p>
            <p className="text-sm text-muted-foreground">
              Send some requests to see them here
            </p>
          </div>
        ) : (
          filteredHistory.map((item) => (
            <Card
              key={item.id}
              className="p-3 cursor-pointer hover:bg-card-hover transition-colors"
              onClick={() => onHistoryItemSelect(item)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <span className={`inline-block w-2 h-2 rounded-full ${getMethodColor(item.method)}`} />
                  <span className="text-xs font-mono uppercase text-muted-foreground min-w-[50px]">
                    {item.method}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{item.url}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <Badge className={`${getStatusColor(item.status)} text-white ml-2`}>
                  {item.status}
                </Badge>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}