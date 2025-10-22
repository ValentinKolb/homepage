# Pad Feature - Technical Overview

Real-time collaborative markdown editor built with CodeMirror 6, Loro CRDT, and SolidJS. Implements E2E encrypted collaboration with offline-first architecture.

## Architecture

### Data Flow
```
Local Storage ↔ MarkdownPad Store ↔ Loro CRDT ↔ SSE Channel ↔ Remote Peers
     ↑                                    ↓
   OPFS Doc                        CodeMirror Editor
```

- **Storage**: Dual persistence with localStorage (metadata) + OPFS (CRDT snapshots)
- **Collaboration**: Loro CRDT with SSE-based message relay
- **Editor**: CodeMirror 6 with custom extensions for markdown rendering
- **Encryption**: Room-based E2E encryption using pad ID as key

### Core Components

**`util.tsx`** - Data layer and storage abstractions
- `MarkdownPad` type with metadata fields
- `createPadStore()` - Reactive localStorage binding
- OPFS integration for CRDT document persistence
- SuperJSON serialization for complex types (LoroDoc, VersionVector)

**`index.tsx`** - Pad discovery and management UI
- Fuzzy search with Fuse.js across title/content
- Context menu operations (pin, rename, delete, copy)
- Grid layout with search highlighting and pinned-first sorting

**`pad-editor/index.tsx`** - Editor container and loading states
- Resource-based loading with minimum load time
- Error handling for OPFS read failures
- Document title synchronization

**`pad-editor/editor.tsx`** - Main editor integration
- CodeMirror 6 configuration with markdown support
- Extension composition and theme switching
- Toolbar with collaboration indicators and export options

**`pad-editor/collab.tsx`** - Real-time collaboration engine
- Loro CRDT integration with undo/redo support
- Ephemeral stores for cursor tracking and user presence
- Automatic conflict resolution and offline sync

## Extension System

### Architecture Pattern
All extensions follow a consistent pattern:
1. **Detection** - Use `syntaxTree()` or regex to find target elements
2. **State Management** - `StateField` for decoration tracking
3. **Widget Rendering** - `WidgetType` for custom DOM elements
4. **Cursor Logic** - Skip decorations when cursor is inside element
5. **Event Handling** - Click-to-edit functionality

### Key Extensions

**`info-blocks.tsx`** - Alert blocks with color-coded styling
- Syntax: `:::type\ncontent\n:::` (info/success/warning/danger)
- Decoration.replace with formatted HTML widgets
- Basic markdown rendering (bold, italic, code, links)

**`code/index.tsx`** - Executable code blocks
- Run buttons for supported languages (JS, SQL)
- Output capture with copy/clear functionality
- Language-specific autocomplete integration

**`lists.tsx`** - Interactive checkbox lists
- Parse markdown list syntax with checkbox detection
- Real-time state updates through content modification
- Shared utilities for other extensions

**`tables.tsx`** - Enhanced table rendering
- Aligned column display with proper spacing
- Toggle between markdown and rendered view
- Click-to-edit functionality

## Collaboration Details

### CRDT Integration
- **Document**: Loro text type for conflict-free editing
- **Cursors**: Ephemeral store with 1s timeout
- **Users**: Ephemeral store with 5s timeout + heartbeat

### Security Model
- Room ID = Pad ID (deterministic)
- E2E encryption using room-based keys
- Server only relays encrypted messages
- Server-side data persistence is asymmetrically encrypted