import { createSignal, type Accessor } from "solid-js";
import { createStore, type SetStoreFunction, type Store } from "solid-js/store";

// ==========================
// Type Definitions
// ==========================

/**
 * Validator function for a single field.
 * Returns an error message string if validation fails, null if valid.
 */
type FieldValidator<T, K extends keyof T> = (
  value: T[K],
  values: T,
) => string | null;

/**
 * Validator configuration for form fields.
 * Each field can have its own validator function.
 */
type FormValidator<T> = Partial<{
  [K in keyof T]: FieldValidator<T, K>;
}>;

/**
 * Options for createForm function.
 *
 * @template T - The type of form values.
 */
type CreateFormOptions<T> = {
  /**
   * Initial values for the form fields.
   * Can be an object or a function that returns the initial values.
   */
  initial: T | (() => T);

  /**
   * Optional validator configuration for form fields.
   */
  validate?: FormValidator<T>;
};

/**
 * Form handler providing utilities for form management.
 *
 * @template T - The type of form values.
 */
type FormHandler<T> = {
  /**
   * Submit handler that prevents default form submission and calls onSubmit only if validation passes.
   *
   * @param onSubmit - Callback to execute with form values when validation succeeds.
   * @returns Event handler function for form submission.
   *
   * @example
   * ```tsx
   * <form onSubmit={form.submit(async (values) => {
   *   await saveUser(values);
   * })}>
   * ```
   */
  submit: (
    onSubmit: (values: T) => void | Promise<void>,
  ) => (e?: Event) => void;

  /**
   * Reactive store containing validation errors for each field.
   * Fields without errors will be undefined.
   */
  errors: Store<Partial<Record<keyof T, string>>>;

  /**
   * Signal indicating whether any field has been touched/focused.
   */
  touched: Accessor<boolean>;

  /**
   * Resets form to initial values and clears all errors.
   */
  reset: () => void;

  /**
   * Validates all fields and returns whether the form is valid.
   * Updates the errors store with validation results.
   */
  validate: () => boolean;
};

/**
 * Return type for createForm function.
 *
 * @template T - The type of form values.
 */
type CreateFormResult<T> = [Store<T>, SetStoreFunction<T>, FormHandler<T>];

// ==========================
// Implementation
// ==========================

/**
 * Creates a reactive form with built-in validation and state management.
 *
 * @template T - The type of form values (must be a record/object).
 * @param options - Configuration options for the form.
 * @returns Tuple containing [values store, setValues function, form handler].
 *
 * @example
 * ```tsx
 * const [values, setValues, form] = createForm({
 *   initial: { email: "", password: "" },
 *   validate: {
 *     email: (val) => !val ? "Email ist erforderlich" : null,
 *     password: (val) => val.length < 8 ? "Mindestens 8 Zeichen" : null
 *   }
 * });
 *
 * <form onSubmit={form.submit(handleSubmit)}>
 *   <input
 *     value={values.email}
 *     onInput={(e) => setValues('email', e.currentTarget.value)}
 *   />
 *   {form.errors.email && <span>{form.errors.email}</span>}
 * </form>
 * ```
 */
export const createForm = <T extends Record<string, any>>(
  options: CreateFormOptions<T>,
): CreateFormResult<T> => {
  // Get initial values from function or object
  const getInitialValues = (): T => {
    const initial =
      typeof options.initial === "function"
        ? options.initial()
        : options.initial;
    return structuredClone(initial);
  };

  // Core form state
  const [values, _setValues] = createStore<T>(getInitialValues());
  const [errors, setErrors] = createStore<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = createSignal(false);

  // Wrapped setValues that handles touched state and clears errors
  const setValues: SetStoreFunction<T> = (...args: any) => {
    setTouched(true);
    // Handle different setValues signatures
    if (args.length >= 1 && typeof args[0] === "string") {
      const field = args[0] as keyof T;
      // Clear error when field changes
      if (errors[field]) {
        setErrors(field as any, undefined!);
      }
    }

    // Call original setValues
    return (_setValues as any)(...args);
  };

  /**
   * Validates all fields and returns whether form is valid.
   */
  const validate = (): boolean => {
    if (!options.validate) return true;

    let isValid = true;
    const newErrors: Partial<Record<keyof T, string>> = {};

    // Validate each field that has a validator
    Object.keys(options.validate).forEach((field) => {
      const error = options.validate![field as keyof T]!(
        values[field as keyof T],
        values,
      );

      if (error) {
        newErrors[field as keyof T] = error;
        isValid = false;
      }
    });

    // Update errors store
    setErrors(newErrors as any);

    return isValid;
  };

  /**
   * Creates submit handler that validates before calling onSubmit.
   */
  const submit = (onSubmit: (values: T) => void | Promise<void>) => {
    return (e?: Event) => {
      e?.preventDefault();

      if (validate()) {
        onSubmit(values);
      }
    };
  };

  /**
   * Resets form to initial state.
   */
  const reset = () => {
    _setValues(getInitialValues());
    setErrors({} as any);
    setTouched(false);
  };

  // Return form API
  const handler: FormHandler<T> = {
    submit,
    errors,
    touched,
    reset,
    validate,
  };

  return [values, setValues, handler];
};
