# SolidJS LocalStorage

A reactive localStorage library for SolidJS with automatic cross-tab synchronization and type safety. Provides seamless data persistence with real-time updates across browser tabs and components.

## Features

- **Reactive Stores**: Automatic reactivity with SolidJS signals and stores
- **Cross-tab Sync**: Real-time synchronization between browser tabs using BroadcastChannel
- **Type Safety**: Full TypeScript support with generic types
- **JSON Serialization**: Automatic serialization with superjson for complex data types
- **Query System**: Watch multiple localStorage keys with filtering
- **Few Dependencies**: Only requires SolidJS and superjson
- **Race Condition Safe**: Prevents cross-tab race conditions

## Installation

Copy the `index.tsx` file into your project. Dependencies:
- SolidJS (solid-js)
- superjson

```bash
npm install superjson
```

## Basic Usage

### Simple Store

```tsx
import { createLocalStore } from 'path/to/localstorage';

function UserProfile() {
  const [user, setUser] = createLocalStore("user", {
    name: "",
    email: "",
    preferences: { theme: "light" }
  });

  return (
    <div>
      <h1>Welcome, {user.name || "Guest"}!</h1>
      <input
        value={user.name}
        onInput={(e) => setUser("name", e.target.value)}
        placeholder="Enter your name"
      />
      <input
        value={user.email}
        onInput={(e) => setUser("email", e.target.value)}
        placeholder="Enter your email"
      />
      
      <button onClick={() => setUser("preferences", "theme", "dark")}>
        Switch to Dark Theme
      </button>
      
      <p>Current theme: {user.preferences.theme}</p>
    </div>
  );
}
```

### Cross-Tab Synchronization

The magic happens automatically! Open the same app in multiple tabs:

```tsx
import { createLocalStore } from 'path/to/localstorage';

function Counter() {
  const [counter, setCounter] = createLocalStore("counter", { count: 0 });

  return (
    <div>
      <h2>Count: {counter.count}</h2>
      <button onClick={() => setCounter("count", c => c + 1)}>
        Increment
      </button>
      <button onClick={() => setCounter("count", c => c - 1)}>
        Decrement
      </button>
      <p>Try opening this in another tab - they stay in sync!</p>
    </div>
  );
}
```

## Advanced Usage

### Query Multiple Stores

```tsx
import { createLocalStoreQuery } from 'path/to/localstorage';
import { For } from 'solid-js';

function TodoManager() {
  // Single todo store
  const [newTodo, setNewTodo] = createLocalStore("new-todo", {
    title: "",
    description: ""
  });

  // Query all todo items
  const [todos, reloadTodos] = createLocalStoreQuery(
    key => key.startsWith("todo:")
  );

  const addTodo = () => {
    if (!newTodo.title.trim()) return;
    
    const id = Date.now().toString();
    const todoKey = `todo:${id}`;
    
    // Create new todo store
    const [todo, setTodo] = createLocalStore(todoKey, {
      id,
      title: newTodo.title,
      description: newTodo.description,
      completed: false,
      createdAt: new Date().toISOString()
    });

    // Clear form
    setNewTodo({ title: "", description: "" });
  };

  const deleteTodo = (key: string) => {
    deleteFromLocalStore(key);
  };

  return (
    <div>
      <h2>Todo Manager</h2>
      
      {/* Add new todo form */}
      <div>
        <input
          value={newTodo.title}
          onInput={(e) => setNewTodo("title", e.target.value)}
          placeholder="Todo title"
        />
        <textarea
          value={newTodo.description}
          onInput={(e) => setNewTodo("description", e.target.value)}
          placeholder="Todo description"
        />
        <button onClick={addTodo}>Add Todo</button>
      </div>

      {/* Todo list */}
      <div>
        <h3>Todos ({todos.length})</h3>
        <For each={todos}>
          {(todo) => (
            <div class="todo-item">
              <h4>{todo.title}</h4>
              <p>{todo.description}</p>
              <span>Created: {new Date(todo.createdAt).toLocaleDateString()}</span>
              <button onClick={() => deleteTodo(todo._key)}>Delete</button>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
```

### Enhanced Records with Computed Properties

```tsx
import { createLocalStoreQuery } from 'path/to/localstorage';

function NotesWithSearch() {
  const [searchTerm, setSearchTerm] = createSignal("");
  
  const [notes] = createLocalStoreQuery(
    key => key.startsWith("note:"),
    {
      // Enhance each note with computed properties
      enhanceRecord: (note) => ({
        ...note,
        // Add search relevance score
        searchScore: calculateSearchScore(note.content, searchTerm()),
        // Add formatted date
        formattedDate: new Date(note.createdAt).toLocaleDateString(),
        // Add word count
        wordCount: note.content.split(/\s+/).length
      })
    }
  );

  // Filter and sort notes by search relevance
  const filteredNotes = () => 
    notes
      .filter(note => !searchTerm() || note.searchScore > 0)
      .sort((a, b) => b.searchScore - a.searchScore);

  return (
    <div>
      <input
        value={searchTerm()}
        onInput={(e) => setSearchTerm(e.target.value)}
        placeholder="Search notes..."
      />
      
      <For each={filteredNotes()}>
        {(note) => (
          <div class="note">
            <h3>{note.title}</h3>
            <p>{note.content}</p>
            <small>
              {note.formattedDate} • {note.wordCount} words
              {searchTerm() && ` • Score: ${note.searchScore}`}
            </small>
          </div>
        )}
      </For>
    </div>
  );
}

function calculateSearchScore(content: string, term: string): number {
  if (!term) return 1;
  const matches = content.toLowerCase().includes(term.toLowerCase());
  return matches ? 1 : 0;
}
```

### Settings Manager with SessionStorage

```tsx
import { createLocalStore } from 'path/to/localstorage';

function SettingsManager() {
  // Persistent settings in localStorage
  const [settings, setSettings] = createLocalStore("app-settings", {
    theme: "light",
    language: "en",
    notifications: true,
    autoSave: true
  });

  // Session-only settings in sessionStorage
  const [sessionSettings, setSessionSettings] = createLocalStore(
    "session-settings",
    {
      sidebarCollapsed: false,
      currentView: "dashboard"
    },
    sessionStorage // Use sessionStorage instead of localStorage
  );

  return (
    <div>
      <h2>Settings</h2>
      
      <section>
        <h3>Persistent Settings</h3>
        <label>
          <input
            type="checkbox"
            checked={settings.notifications}
            onChange={(e) => setSettings("notifications", e.target.checked)}
          />
          Enable Notifications
        </label>
        
        <label>
          Theme:
          <select
            value={settings.theme}
            onChange={(e) => setSettings("theme", e.target.value)}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto</option>
          </select>
        </label>
      </section>

      <section>
        <h3>Session Settings</h3>
        <label>
          <input
            type="checkbox"
            checked={sessionSettings.sidebarCollapsed}
            onChange={(e) => setSessionSettings("sidebarCollapsed", e.target.checked)}
          />
          Collapse Sidebar
        </label>
      </section>
    </div>
  );
}
```

### Real-time Collaboration Simulation

```tsx
import { createLocalStore, createLocalStoreQuery } from 'path/to/localstorage';
import { createSignal, For } from 'solid-js';

function CollaborativeEditor() {
  const [document, setDocument] = createLocalStore("shared-doc", {
    content: "",
    lastModified: Date.now(),
    version: 1
  });

  // Track active users across tabs
  const [currentUser] = createLocalStore("current-user", {
    id: Math.random().toString(36).substr(2, 9),
    name: `User ${Math.floor(Math.random() * 1000)}`,
    lastSeen: Date.now(),
    cursor: 0
  });

  const [activeUsers] = createLocalStoreQuery(
    key => key.startsWith("user:") && key !== "current-user"
  );

  // Update user activity
  const updateActivity = () => {
    setCurrentUser("lastSeen", Date.now());
  };

  // Auto-update activity every 5 seconds
  setInterval(updateActivity, 5000);

  const handleContentChange = (newContent: string) => {
    setDocument({
      content: newContent,
      lastModified: Date.now(),
      version: document.version + 1
    });
    updateActivity();
  };

  return (
    <div>
      <h2>Collaborative Editor</h2>
      
      <div class="user-info">
        <span>You: {currentUser.name}</span>
        <span>Document v{document.version}</span>
      </div>

      <div class="active-users">
        <h4>Active Users:</h4>
        <For each={activeUsers.filter(u => Date.now() - u.lastSeen < 30000)}>
          {(user) => (
            <span class="user-badge">{user.name}</span>
          )}
        </For>
      </div>

      <textarea
        value={document.content}
        onInput={(e) => handleContentChange(e.target.value)}
        placeholder="Start typing... Changes sync across all tabs!"
        rows={10}
        cols={80}
      />
      
      <p>Last modified: {new Date(document.lastModified).toLocaleString()}</p>
    </div>
  );
}
```

## API Reference

### `createLocalStore`

```typescript
function createLocalStore<T extends Record<string, any>>(
  key: string,
  defaultValue: T,
  storage?: Storage
): [Store<StoreItem<T>>, SetStoreFunction<StoreItem<T>>]
```

Creates a reactive store with localStorage persistence.

**Parameters:**
- `key`: Unique localStorage key
- `defaultValue`: Default value when storage is empty
- `storage`: Storage instance (default: `localStorage`)

**Returns:**
- `[store, setStore]`: SolidJS store tuple with automatic persistence

### `createLocalStoreQuery`

```typescript
function createLocalStoreQuery<T extends Record<string, any>>(
  keysFilter?: (key: string) => boolean,
  options?: LocalStoreQueryOptions<T>
): [Store<StoreItem<T>[]>, () => void]
```

Creates a reactive query for multiple localStorage keys.

**Parameters:**
- `keysFilter`: Function to filter keys (optional)
- `options.storage`: Storage instance (default: `localStorage`)
- `options.enhanceRecord`: Function to enhance each record

**Returns:**
- `[stores, reload]`: Array of stores and manual reload function

### `deleteFromLocalStore`

```typescript
function deleteFromLocalStore(key: string, storage?: Storage): void
```

Deletes a key and notifies all stores/queries.

### `modifyLocalStore`

```typescript
function modifyLocalStore<T>(key: string, value: T, storage?: Storage): void
```

Directly modifies a localStorage key and triggers notifications.

### `existsInLocalStorage`

```typescript
function existsInLocalStorage(key: string, storage?: Storage): boolean
```

Checks if a key exists in storage.

## How Synchronization Works

### Same-Tab Synchronization
- Direct in-memory notifications via listener system
- Immediate updates across all stores with matching keys
- No localStorage reads needed for same-tab updates

### Cross-Tab Synchronization
1. Store update triggers localStorage write
2. BroadcastChannel message sent to other tabs (with micro-delay)
3. Other tabs receive message and reload from localStorage
4. All reactive stores update automatically

### Race Condition Prevention
- Micro-delay (`setTimeout(..., 0)`) ensures localStorage write completes
- Prevents partial data reads in other tabs
- BroadcastChannel messages include only keys, not values

## Type Parameters

- `T extends Record<string, any>`: The shape of your stored data
- All stored items automatically include `_key: string` property
- Full TypeScript inference for nested properties

## Best Practices

1. **Unique Keys**: Use descriptive, unique keys to avoid conflicts
2. **Default Values**: Always provide sensible defaults
3. **Error Handling**: The library handles JSON parse errors gracefully
4. **Memory Management**: Cleanup is automatic via SolidJS's `onCleanup`
5. **Performance**: Use queries for bulk operations, individual stores for single items

## Browser Support

- Modern browsers with BroadcastChannel support
- localStorage or sessionStorage support required