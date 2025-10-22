# SSE Real-time Collaboration System

## Overview

A lightweight SSE system for real-time collaboration with end-to-end encryption. Built for Astro/SolidJS applications.

## Architecture

- **Server**: Singleton BroadcastManager with automatic room cleanup
- **Client**: Reactive SSE connection with encryption
- **Security**: E2E encryption using room-based keys

## Files

### `./broadcast.ts`
Singleton server-side manager for SSE rooms.
- Auto-cleanup when no listeners
- EventEmitter-based message distribution
- Room isolation by ID

### `./server.ts`
Server-side utilities for SSE operations.
- `createSSEStream()`: Creates ReadableStream for SSE
- `publishToRoom()`: Publishes messages to room

### `./client.tsx`
SolidJS reactive SSE client hook.
- Automatic connection management
- E2E encryption/decryption
- Message deduplication (sender filtering)

### `src/pages/api/collab/[roomId].ts`
Astro API endpoints for SSE.
- GET: SSE stream subscription
- POST: Message broadcasting
- Uses server.ts functions for clean separation

## Usage

```tsx
// Client-side real-time sync
const sendMsg = createSSENetworkSync({
  roomId: "room-123",
  onMessage: (data) => console.log("Received:", data),
  onConnect: () => console.log("Connected"),
});

// Send messages
sendMsg({ type: "update", content: "Hello" });
```

## Security

- Room IDs are hashed before transmission
- Messages encrypted with room-based keys
- Sender ID prevents message loops
- No persistent storage (memory-only)

## Performance

- Automatic room cleanup when empty
- Singleton pattern for server efficiency
- Reactive connection management on client
- Minimal overhead with EventEmitter

## Notes

- Uses superjson for complex object serialization
- Built-in AbortController support for clean disconnection
- Compatible with Astro's SSR and SolidJS reactivity