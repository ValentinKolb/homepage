# SolidJS Mutation

A lightweight, type-safe mutation library for SolidJS, inspired by TanStack Query but without the need for context providers or complex configuration.

## Features

- Simple API similar to TanStack Query's `useMutation`
- Built-in cancellation support via `AbortSignal`
- Type-safe with full TypeScript support
- Lightweight with zero dependencies (besides SolidJS)
- No context providers or complex setup required
- Supports retry functionality
- Lifecycle hooks for fine-grained control

## Installation

Just copy the `index.tsx` file into your project. The only dependency is SolidJS itself.

## Basic Usage

```tsx
import { createMutation } from 'path/to/mutation';

// Simple example with a POST request
function MyComponent() {
  const createUser = createMutation({
    mutation: async (newUser, { abortSignal }) => {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
        signal: abortSignal // Use the provided abort signal for cancellation
      });
      
      if (!response.ok) {
        throw new Error('Failed to create user');
      }
      
      return response.json();
    }
  });
  
  return (
    <div>
      <button 
        onClick={() => createUser.mutate({ name: 'John Doe', email: 'john@example.com' })}
        disabled={createUser.loading()}
      >
        {createUser.loading() ? 'Creating...' : 'Create User'}
      </button>
      
      {createUser.data() && <p>User created with ID: {createUser.data().id}</p>}
      {createUser.error() && <p>Error: {createUser.error().message}</p>}
      
      {createUser.loading() && <button onClick={createUser.abort}>Cancel</button>}
    </div>
  );
}
```

## Advanced Usage

### With Lifecycle Hooks

```tsx
import { createMutation } from 'path/to/mutation';
import { createSignal, Show } from 'solid-js';

function AdvancedForm() {
  const [notification, setNotification] = createSignal('');
  
  const updateProfile = createMutation({
    // Main mutation function
    mutation: async (profileData, { abortSignal, formId }) => {
      const response = await fetch(`/api/profiles/${profileData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
        signal: abortSignal
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      return response.json();
    },
    
    // Called before the mutation starts - can return a context object
    onBefore: (vars) => {
      setNotification(`Updating profile for ${vars.name}...`);
      // Return a context object that will be merged with the abortSignal
      return { formId: `profile-${vars.id}` };
    },
    
    // Called if the mutation succeeds
    onSuccess: (data, ctx) => {
      setNotification(`Profile updated successfully! Form ID: ${ctx?.formId}`);
      console.log('Updated data:', data);
    },
    
    // Called if the mutation fails with an error
    onError: (error) => {
      setNotification(`Error: ${error.message}`);
    },
    
    // Called if the mutation is aborted
    onAbort: () => {
      setNotification('Profile update cancelled');
    },
    
    // Called after the mutation completes (success, error, or abort)
    onFinally: () => {
      setTimeout(() => setNotification(''), 3000); // Clear notification after 3 seconds
    }
  });
  
  return (
    <div>
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          updateProfile.mutate({
            id: formData.get('id'),
            name: formData.get('name'),
            bio: formData.get('bio')
          });
        }}
      >
        {/* Form fields */}
        <button type="submit" disabled={updateProfile.loading()}>
          {updateProfile.loading() ? 'Updating...' : 'Update Profile'}
        </button>
      </form>
      
      <Show when={notification()}>
        <div class="notification">{notification()}</div>
      </Show>
      
      <Show when={updateProfile.loading()}>
        <button onClick={updateProfile.abort}>Cancel Update</button>
      </Show>
      
      <Show when={updateProfile.error()}>
        <button onClick={updateProfile.retry}>Retry Update</button>
      </Show>
    </div>
  );
}
```

### Custom Fetching Utility

```tsx
import { createMutation } from 'path/to/mutation';

// Creating a reusable API utility with mutations
const api = {
  // Generic function to create API mutations
  createApiMutation<TData, TVariables>(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST') {
    return createMutation<TData, TVariables>({
      mutation: async (variables, { abortSignal }) => {
        const hasBody = method !== 'GET';
        
        const response = await fetch(`/api/${endpoint}`, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: hasBody ? JSON.stringify(variables) : undefined,
          signal: abortSignal
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `API Error: ${response.status}`);
        }
        
        return response.json();
      }
    });
  },
  
  // Predefined API mutations
  users: {
    create() {
      return api.createApiMutation<User, NewUserInput>('users', 'POST');
    },
    update() {
      return api.createApiMutation<User, UpdateUserInput>('users', 'PUT');
    },
    delete() {
      return api.createApiMutation<void, { id: string }>('users', 'DELETE');
    }
  }
};

// Usage in a component
function UserManagement() {
  const createUser = api.users.create();
  const updateUser = api.users.update();
  const deleteUser = api.users.delete();
  
  // Use the mutations as needed...
}
```

### Upload with Progress Tracking

```tsx
import { createMutation } from 'path/to/mutation';
import { createSignal } from 'solid-js';

function FileUploader() {
  const [progress, setProgress] = createSignal(0);
  
  const uploadFile = createMutation({
    mutation: async (file, { abortSignal }) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const xhr = new XMLHttpRequest();
      
      // Create a promise to handle the XHR
      return new Promise((resolve, reject) => {
        // Set up progress tracking
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setProgress(Math.round((event.loaded / event.total) * 100));
          }
        };
        
        // Handle completion
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };
        
        // Handle errors
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.ontimeout = () => reject(new Error('Upload timed out'));
        
        // Link the abort signal to the XHR
        abortSignal.addEventListener('abort', () => {
          xhr.abort();
          reject(new Error('Upload was cancelled'));
        });
        
        // Send the request
        xhr.open('POST', '/api/upload', true);
        xhr.send(formData);
      });
    },
    
    onFinally: () => {
      setProgress(0); // Reset progress when done
    }
  });
  
  return (
    <div>
      <input 
        type="file" 
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadFile.mutate(file);
        }}
        disabled={uploadFile.loading()}
      />
      
      {uploadFile.loading() && (
        <>
          <progress value={progress()} max="100" />
          <span>{progress()}%</span>
          <button onClick={uploadFile.abort}>Cancel Upload</button>
        </>
      )}
      
      {uploadFile.data() && <p>File uploaded successfully! URL: {uploadFile.data().url}</p>}
      {uploadFile.error() && (
        <div>
          <p>Error: {uploadFile.error().message}</p>
          <button onClick={uploadFile.retry}>Retry Upload</button>
        </div>
      )}
    </div>
  );
}
```

## API Reference

### `createMutation` Function

```typescript
function createMutation<T, V, C = unknown>(
  options: MutationOptions<T, V, C>
): CreateMutationResult<T, V, C>
```

#### Parameters

- `options`: Configuration object for the mutation

#### Returns

An object containing the following reactive properties and methods:

- `data`: Signal accessor returning the mutation result or `null`
- `error`: Signal accessor returning any error that occurred or `null`
- `loading`: Signal accessor indicating whether the mutation is in progress
- `mutate`: Function to trigger the mutation with variables
- `abort`: Function to cancel the current mutation
- `retry`: Function to retry the last mutation with the same variables

### `MutationOptions` Interface

```typescript
interface MutationOptions<T, V, C = unknown> {
  mutation: (vars: V, ctx: C & { abortSignal: AbortSignal }) => Promise<T>;
  onBefore?: (vars: V) => C | Promise<C>;
  onSuccess?: (data: T, ctx?: C & { abortSignal: AbortSignal }) => void;
  onError?: (error: Error, ctx?: C & { abortSignal: AbortSignal }) => void;
  onAbort?: (ctx?: C & { abortSignal: AbortSignal }) => void;
  onFinally?: (ctx?: C & { abortSignal: AbortSignal }) => void;
}
```

## Type Parameters

- `T`: The type of data returned by the mutation
- `V`: The type of variables passed to the mutation
- `C`: The type of context created by the `onBefore` hook (defaults to `unknown`)

## Notes

- The `abortSignal` is automatically included in the context passed to the mutation function
- The `retry` method will reuse the last variables and context, but will not re-execute the `onBefore` hook
- All lifecycle hooks are optional