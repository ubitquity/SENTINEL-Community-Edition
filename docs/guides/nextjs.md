# Next.js Integration Guide

Learn how to integrate SENTINEL into your Next.js applications.

## Table of Contents

- [Installation](#installation)
- [API Routes](#api-routes)
- [Server Actions](#server-actions)
- [Middleware](#middleware)
- [Client-Side Integration](#client-side-integration)
- [Production Deployment](#production-deployment)

## Installation

```bash
npm install @neura-help/sentinel-community
```

## API Routes

### App Router (Next.js 13+)

#### Basic Chat API Route

```typescript
// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Sentinel } from '@neura-help/sentinel-community';

const sentinel = new Sentinel({
  maxInputLength: 10000,
  redactPII: true
});

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Use SENTINEL pipeline
    const result = await sentinel.pipeline(message, async (safeInput) => {
      // Your LLM call here
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{ role: 'user', content: safeInput }]
        })
      });

      const data = await response.json();
      return data.choices[0].message.content;
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      response: result.response,
      metadata: {
        inputThreats: result.inputThreats,
        redactions: result.redactions
      }
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
```

#### Streaming API Route

```typescript
// app/api/chat/stream/route.ts
import { NextRequest } from 'next/server';
import { Sentinel } from '@neura-help/sentinel-community';
import OpenAI from 'openai';

const sentinel = new Sentinel();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  const { message } = await request.json();

  // Protect input first
  const inputResult = await sentinel.protect(message);

  if (inputResult.threats.length > 0) {
    return new Response(
      JSON.stringify({ error: 'Threats detected', threats: inputResult.threats }),
      { status: 400 }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [{ role: 'user', content: inputResult.output }],
          stream: true
        });

        let fullResponse = '';

        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content || '';
          fullResponse += content;

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
          );
        }

        // Filter complete response
        const filtered = await sentinel.filterOutput(fullResponse);

        if (filtered.filtered) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              final: filtered.output,
              redactions: filtered.redactions
            })}\n\n`)
          );
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}
```

### Pages Router (Next.js 12 and below)

```typescript
// pages/api/chat.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { Sentinel } from '@neura-help/sentinel-community';

const sentinel = new Sentinel();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;

  const result = await sentinel.pipeline(message, async (safeInput) => {
    // Your LLM integration
    return await yourLLM.complete(safeInput);
  });

  if (!result.success) {
    return res.status(500).json({ error: result.error });
  }

  res.status(200).json({ response: result.response });
}
```

## Server Actions

Next.js 13+ supports Server Actions for server-side logic.

```typescript
// app/actions/chat.ts
'use server';

import { Sentinel } from '@neura-help/sentinel-community';

const sentinel = new Sentinel();

export async function chatAction(message: string) {
  const result = await sentinel.pipeline(message, async (safeInput) => {
    // Your LLM call
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: safeInput }]
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;
  });

  return result;
}
```

```typescript
// app/components/ChatForm.tsx
'use client';

import { useState } from 'react';
import { chatAction } from '../actions/chat';

export default function ChatForm() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await chatAction(message);

      if (result.success) {
        setResponse(result.response);
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Sending...' : 'Send'}
      </button>
      {response && <div className="response">{response}</div>}
    </form>
  );
}
```

## Middleware

Protect all API routes with Next.js middleware:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Sentinel } from '@neura-help/sentinel-community';

const sentinel = new Sentinel({
  maxInputLength: 10000,
  redactPII: true
});

export async function middleware(request: NextRequest) {
  // Only protect API routes
  if (!request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Skip health checks
  if (request.nextUrl.pathname === '/api/health') {
    return NextResponse.next();
  }

  try {
    // Get request body
    const body = await request.json();

    // Sanitize all string values
    const sanitized: any = {};
    for (const [key, value] of Object.entries(body)) {
      if (typeof value === 'string') {
        const result = await sentinel.protect(value);

        if (result.threats.length > 0) {
          console.warn(`Threats detected in ${key}:`, result.threats);
        }

        sanitized[key] = result.output;
      } else {
        sanitized[key] = value;
      }
    }

    // Create new request with sanitized body
    const response = NextResponse.next();

    // Pass sanitized data via headers (for small data)
    // Or use a more sophisticated approach for larger payloads
    response.headers.set('x-sanitized-data', JSON.stringify(sanitized));

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.json(
      { error: 'Security validation failed' },
      { status: 500 }
    );
  }
}

export const config = {
  matcher: '/api/:path*'
};
```

## Client-Side Integration

### React Hook for Chat

```typescript
// hooks/useChat.ts
import { useState, useCallback } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    setLoading(true);
    setError(null);

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      // Add assistant message
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.response }
      ]);

      // Log security metadata
      if (data.metadata?.inputThreats?.length > 0) {
        console.warn('Threats detected:', data.metadata.inputThreats);
      }

      if (data.metadata?.redactions?.length > 0) {
        console.info('PII redacted:', data.metadata.redactions);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearMessages
  };
}
```

### Chat Component

```typescript
// components/Chat.tsx
'use client';

import { useState } from 'react';
import { useChat } from '../hooks/useChat';

export default function Chat() {
  const [input, setInput] = useState('');
  const { messages, loading, error, sendMessage } = useChat();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    await sendMessage(input);
    setInput('');
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <strong>{msg.role}:</strong> {msg.content}
          </div>
        ))}
      </div>

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
```

### Streaming Chat Component

```typescript
// components/StreamingChat.tsx
'use client';

import { useState } from 'react';

export default function StreamingChat() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [streaming, setStreaming] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || streaming) return;

    setStreaming(true);
    setResponse('');

    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              setStreaming(false);
              break;
            }

            try {
              const parsed = JSON.parse(data);

              if (parsed.content) {
                setResponse(prev => prev + parsed.content);
              }

              if (parsed.final) {
                setResponse(parsed.final);
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
    } finally {
      setStreaming(false);
    }

    setInput('');
  };

  return (
    <div>
      <div className="response">{response}</div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={streaming}
        />
        <button type="submit" disabled={streaming}>
          {streaming ? 'Streaming...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
```

## Production Deployment

### Environment Variables

```bash
# .env.local
OPENAI_API_KEY=your_api_key_here
SENTINEL_MAX_LENGTH=10000
SENTINEL_REDACT_PII=true
SENTINEL_LOG_LEVEL=info
```

### Configuration

```typescript
// lib/sentinel.ts
import { Sentinel } from '@neura-help/sentinel-community';

export const sentinel = new Sentinel({
  maxInputLength: parseInt(process.env.SENTINEL_MAX_LENGTH || '10000'),
  redactPII: process.env.SENTINEL_REDACT_PII !== 'false',
  redactSecrets: true,
  logLevel: (process.env.SENTINEL_LOG_LEVEL || 'info') as any
});
```

### Vercel Deployment

```json
// vercel.json
{
  "env": {
    "SENTINEL_MAX_LENGTH": "10000",
    "SENTINEL_REDACT_PII": "true"
  },
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### Performance Optimization

```typescript
// lib/singleton.ts
import { Sentinel } from '@neura-help/sentinel-community';

let sentinelInstance: Sentinel | null = null;

export function getSentinel(): Sentinel {
  if (!sentinelInstance) {
    sentinelInstance = new Sentinel({
      maxInputLength: 10000,
      redactPII: true
    });
  }
  return sentinelInstance;
}
```

```typescript
// app/api/chat/route.ts
import { getSentinel } from '@/lib/singleton';

const sentinel = getSentinel();

export async function POST(request: NextRequest) {
  // Use singleton instance
  const result = await sentinel.protect(message);
  // ...
}
```

## Testing

### API Route Testing

```typescript
// __tests__/api/chat.test.ts
import { POST } from '@/app/api/chat/route';
import { NextRequest } from 'next/server';

describe('/api/chat', () => {
  it('should sanitize malicious input', async () => {
    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Hello <script>alert("xss")</script>'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.response).not.toContain('<script>');
  });
});
```

## Next Steps

- [Express Integration](./express.md)
- [API Reference](../api/README.md)
- [Examples](../examples/)
