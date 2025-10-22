# createForm

A minimal, type-safe form state management utility for SolidJS that extends `createStore` with validation and form-specific functionality.

## Features

- **Type-safe**: Full TypeScript support with type inference
- **Drop-in replacement**: Compatible with `createStore` API
- **Built-in validation**: Field-level validation with custom validators
- **Reactive**: Errors and state updates trigger re-renders automatically
- **Minimal API**: Simple and intuitive to use
- **Auto-touch**: Automatically tracks field interactions
- **Auto-clear errors**: Errors clear when fields are modified

## Installation

No additional dependencies required - uses SolidJS's built-in `createStore`.

## Basic Usage

```tsx
import { createForm } from '@/lib/solidjs/form';

const LoginForm = () => {
  const [values, setValues, form] = createForm({
    initial: {
      email: '',
      password: ''
    },
    validate: {
      email: (val) => !val ? 'Email ist erforderlich' : null,
      password: (val) => val.length < 8 ? 'Mindestens 8 Zeichen' : null
    }
  });

  return (
    <form onSubmit={form.submit(async (data) => {
      await login(data);
    })}>
      <input
        type="email"
        placeholder="Email"
        value={values.email}
        onInput={(e) => setValues('email', e.currentTarget.value)}
      />
      {form.errors.email && (
        <span class="text-red-500">{form.errors.email}</span>
      )}

      <input
        type="password"
        placeholder="Passwort"
        value={values.password}
        onInput={(e) => setValues('password', e.currentTarget.value)}
      />
      {form.errors.password && (
        <span class="text-red-500">{form.errors.password}</span>
      )}

      <button type="submit" disabled={!form.touched()}>
        Anmelden
      </button>
      
      <button type="button" onClick={form.reset}>
        Zurücksetzen
      </button>
    </form>
  );
};
```

## API

### `createForm<T>(options)`

Creates a new form with the given options.

**Options:**
- `initial`: Initial values for the form (can be object or function)
- `validate`: Optional validator configuration

**Returns:** `[values, setValues, form]`

- `values`: Reactive store containing current form values
- `setValues`: Function to update form values (same as `createStore`)
- `form`: Form handler object with utility methods

### Form Handler Methods

#### `form.submit(onSubmit)`
Creates a submit handler that prevents default form submission and validates before calling `onSubmit`.

```tsx
<form onSubmit={form.submit(async (values) => {
  await saveData(values);
})}>
```

#### `form.errors`
Reactive store containing validation errors. Fields without errors are `undefined`.

```tsx
{form.errors.username && <span>{form.errors.username}</span>}
```

#### `form.touched()`
Signal that returns `true` if any field has been interacted with.

```tsx
<button disabled={!form.touched()}>Speichern</button>
```

#### `form.reset()`
Resets form to initial values and clears all errors.

```tsx
<button onClick={form.reset}>Zurücksetzen</button>
```

#### `form.validate()`
Manually validates all fields. Returns `true` if valid.

```tsx
const isValid = form.validate();
```

## Validation

Validators are functions that receive the field value and all form values:

```tsx
type Validator<T, K extends keyof T> = (
  value: T[K],
  values: T
) => string | null;
```

Return a string error message if validation fails, `null` if valid.

### Examples

```tsx
const validator = {
  // Simple required field
  username: (val) => !val ? 'Benutzername erforderlich' : null,

  // Pattern validation
  email: (val) => {
    if (!val) return 'Email erforderlich';
    if (!val.includes('@')) return 'Ungültige Email';
    return null;
  },

  // Cross-field validation
  confirmPassword: (val, values) => {
    if (val !== values.password) {
      return 'Passwörter stimmen nicht überein';
    }
    return null;
  }
};
```

### Dynamic Initial Values

Use a function to generate initial values that are re-evaluated on reset:

```tsx
const [values, setValues, form] = createForm({
  initial: () => ({
    timestamp: new Date().toISOString(),
    userId: getCurrentUser()?.id || '',
    settings: getDefaultSettings()
  }),
  validate: {
    userId: (val) => !val ? 'User erforderlich' : null
  }
});

// form.reset() will call the initial function again
```

### Advanced Usage

### Manual Value Updates

Since it's a drop-in replacement for `createStore`, you can use `setValues` directly:

```tsx
// Update single field (automatically sets touched and clears errors)
setValues('email', 'user@example.com');

// Update multiple fields
setValues({ email: 'user@example.com', name: 'Max' });

// Update nested values
setValues('address', 'street', 'Hauptstraße 1');
```

### Auto-Touch and Error Clearing

The wrapped `setValues` function automatically:
- Marks fields as touched on first interaction
- Clears validation errors when field values change

This means you don't need to manually manage these states - just use `setValues` normally and the form handler takes care of the rest.

## TypeScript

The library is fully type-safe. Form values and validator keys are inferred:

```tsx
type UserForm = {
  name: string;
  email: string;
  age: number;
};

const [values, setValues, form] = createForm<UserForm>({
  initial: { name: '', email: '', age: 0 },
  validate: {
    // TypeScript ensures only valid field names
    name: (val) => !val ? 'Name erforderlich' : null,
    // Error: 'invalid' does not exist in type UserForm
    invalid: (val) => null
  }
});

// Type-safe field access
const name = values.name; // string
const email = values.email; // string
```
