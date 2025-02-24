import { createEffect, on, onCleanup } from "solid-js";
import { liveQuery, type PromiseExtended } from "dexie";
import { createStore, reconcile } from "solid-js/store";

// Nutze als ReconcileOptions den zweiten Parameter von reconcile
export type ReconcileOptions = Parameters<typeof reconcile>[1];

// Overload für Single‑Value‑Queries
export function createLiveQuery<T>(
  query: () => PromiseExtended<T> | T,
  defaultValue?: T,
  options?: ReconcileOptions,
): T | undefined;

// Overload für Array‑Queries
export function createLiveQuery<T>(
  query: () => PromiseExtended<T[]> | T[],
  defaultValue: T[],
  options?: ReconcileOptions,
): T[];

// Gemeinsame Implementierung
export function createLiveQuery<T extends object>(
  query: () => PromiseExtended<T | T[]> | T | T[],
  defaultValue?: T | T[],
  options?: ReconcileOptions,
): T | T[] | undefined {
  // Standardmäßig, falls keine Options angegeben sind, wird als key ["id"] verwendet.

  // Erstelle einen Store, der entweder ein einzelnes Objekt oder ein Array enthält.
  const [store, setStore] = createStore(defaultValue ?? undefined);

  createEffect(
    on(query, () => {
      const sub = liveQuery(query).subscribe((v) => {
        setStore(reconcile(v, options));
      });
      onCleanup(() => sub.unsubscribe());
    }),
  );

  return store as T | T[] | undefined;
}
