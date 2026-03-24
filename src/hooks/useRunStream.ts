import { useState, useEffect, useCallback } from 'react';
import { getBaseUrl } from '../services/api';

export interface ToolCallEvent {
  tool_name: string;
  args: any;
  tool_call_id: string;
}

export interface ToolResultEvent {
  tool_name: string;
  tool_call_id: string;
  content: string;
}

export type StreamEvent = 
  | { type: 'token'; data: string }
  | { type: 'tool_call'; data: ToolCallEvent }
  | { type: 'tool_result'; data: ToolResultEvent }
  | { type: 'done'; data: string }
  | { type: 'error'; data: string };

export function useRunStream(sessionId: string | null, runId: string | null) {
  const [content, setContent] = useState('');
  const [toolCalls, setToolCalls] = useState<ToolCallEvent[]>([]);
  const [toolResults, setToolResults] = useState<ToolResultEvent[]>([]);
  const [status, setStatus] = useState<'idle' | 'streaming' | 'completed' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId || !runId) {
      setContent('');
      setToolCalls([]);
      setToolResults([]);
      setStatus('idle');
      return;
    }

    const token = localStorage.getItem('token');
    // Note: EventSource doesn't support headers natively, but the API doc mentions it.
    // In a real browser, you might need a polyfill or use fetch with readable streams.
    // However, the doc specifically provides a JavaScript example using EventSource with headers (which is non-standard).
    // I will implement a fetch-based stream reader to be safe and support headers.

    let isCancelled = false;
    setStatus('streaming');
    setContent('');
    setToolCalls([]);
    setToolResults([]);

    const stream = async () => {
      try {
        const response = await fetch(`${getBaseUrl()}/api/v1/sessions/${sessionId}/runs/${runId}/stream`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'text/event-stream'
          }
        });

        if (!response.ok) throw new Error('Failed to connect to stream');
        
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No reader available');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done || isCancelled) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event: StreamEvent = JSON.parse(line.slice(6));
                if (event.type === 'token') {
                  setContent(prev => prev + event.data);
                } else if (event.type === 'tool_call') {
                  setToolCalls(prev => {
                    const existing = prev.find(tc => tc.tool_call_id === event.data.tool_call_id);
                    if (existing) {
                      return prev.map(tc => {
                        if (tc.tool_call_id === event.data.tool_call_id) {
                          // If args is an object, we just replace it (assuming it's a complete event)
                          if (typeof event.data.args === 'object') {
                            return { ...tc, args: event.data.args };
                          }
                          // If it's a string, we append it
                          return { ...tc, args: (tc.args || '') + (event.data.args || '') };
                        }
                        return tc;
                      });
                    }
                    return [...prev, event.data];
                  });
                } else if (event.type === 'tool_result') {
                  setToolResults(prev => [...prev, event.data]);
                } else if (event.type === 'done') {
                  setContent(event.data);
                  setStatus('completed');
                } else if (event.type === 'error') {
                  setError(event.data);
                  setStatus('error');
                }
              } catch (e) {
                console.error('Error parsing SSE line:', line);
              }
            }
          }
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Stream error');
          setStatus('error');
        }
      }
    };

    stream();

    return () => {
      isCancelled = true;
    };
  }, [sessionId, runId]);

  return { content, toolCalls, toolResults, status, error };
}
