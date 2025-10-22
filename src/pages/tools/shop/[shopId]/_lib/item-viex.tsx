import type { ShopItem } from "@/actions/shop/types";
import { createStore } from "solid-js/store";
import { euro } from "./util";
import { createSignal } from "solid-js";
import Tooltip from "@/components/solidjs/Tooltip";
import { createMutation } from "@/lib/solidjs/mutation";
import { DialogHeader, prompts } from "@/lib/client/prompt-lib";
import NumberInput from "@/components/solidjs/input/number";
import { ActionError, actions } from "astro:actions";
import PinInput from "@/components/solidjs/input/pin";
import SelectInput from "@/components/solidjs/input/select";
import { createForm } from "@/lib/solidjs/form";

const ItemView = (initial: {
  item: ShopItem;
  userBalance: number | null;
  isGuest: boolean;
  users: { userId: string; username: string }[];
}) => {
  const [item, setItem] = createStore(initial.item);
  const [userBalance, setUserBalance] = createSignal(initial.userBalance);

  const purchaseMutation = createMutation({
    mutation: async () => {
      const data = await prompts.dialog((close) => {
        const [values, setValues, handler] = createForm({
          initial: {
            userId: undefined as string | undefined,
            quantity: 1,
            token: undefined as string | undefined,
          },
        });

        return (
          <div class="flex flex-col gap-6">
            <DialogHeader
              icon="ti ti-cash-register"
              title={item.name}
              close={close}
            />

            {item.imgSrc && (
              <img
                src={item.imgSrc}
                alt={item.name}
                class="h-30 w-30 self-center overflow-hidden rounded-lg object-cover"
              />
            )}
            <p class="text-dimmed text-sm">
              Wie viel Artikel möchtest du{" "}
              {item.priceCents > 0 ? (
                <>
                  für einen Gesamtpreis von{" "}
                  <span class="font-mono tabular-nums">
                    {euro(item.priceCents * values.quantity)}
                  </span>{" "}
                  kaufen
                </>
              ) : (
                "entnehmen"
              )}
              ?
            </p>
            <NumberInput
              value={() => values.quantity}
              onChange={(v) => setValues("quantity", v)}
              min={1}
            />
            {initial.isGuest && (
              <>
                <SelectInput
                  label="Person auswählen"
                  description="Wähle dich aus der Liste aus."
                  value={() => values.userId}
                  onChange={(v) => setValues("userId", v)}
                  options={initial.users
                    .sort((a, b) => a.username.localeCompare(b.username))
                    .map((user) => ({
                      id: user.userId,
                      label: user.username,
                      description: user.userId,
                    }))}
                />

                <PinInput
                  label="TOTP Code"
                  description="Bitte gebe einen TOTP Code ein um dich zu authentifizieren."
                  value={() => values.token ?? ""}
                  onChange={(v) => setValues("token", v)}
                  stretch
                />
              </>
            )}

            <div class="flex flex-row justify-end gap-2">
              <button
                class="btn-subtle px-3 py-2 text-sm"
                onClick={() => close()}
              >
                Abbrechen
              </button>
              <button
                class="btn-success px-3 py-2 text-sm"
                onClick={handler.submit(close)}
              >
                {item.priceCents > 0 ? "Kaufen" : "Entnehmen"}
                <i class="ti ti-arrow-right"></i>
              </button>
            </div>
          </div>
        );
      });

      if (data === undefined) return false;

      const { remainingStock, newBalance } =
        await actions.shop.transactions.purchase.orThrow({
          itemId: item.id,
          quantity: data.quantity,
          totp: initial.isGuest
            ? {
                userId: data.userId,
                token: data.token,
              }
            : undefined,
        });

      setItem("stock", remainingStock);
      setUserBalance(newBalance);
      const element = document.getElementById("user-balance");
      if (element) element.innerText = euro(newBalance);
      return true;
    },
    onSuccess: async (baught) =>
      baught &&
      (await prompts.alert("Vielen Dank für den Kauf! Bis zum nächsten Mal!", {
        title: "Erfolgreich gekauft!",
        icon: "ti ti-check",
      })),
    onError: async (e) => {
      const msg =
        e instanceof ActionError && e.code === "UNAUTHORIZED"
          ? "Authentifizierung fehlgeschlagen. Bitte versuche es erneut."
          : "Der Kauf ist leider fehlgeschlagen. Bitte versuche es erneut.";

      await prompts.error(msg);
    },
  });

  const toExpensive = () =>
    userBalance() !== null ? item.priceCents > userBalance()! : false;
  const noStock = () => item.stock <= 0;
  const cantBuy = () => noStock() || toExpensive();

  return (
    <article class="flex gap-2 rounded p-2 transition-all duration-200 sm:flex-col dark:bg-gray-900">
      {/* Image */}
      <figure class="relative h-20 w-20 flex-shrink-0 self-center overflow-hidden rounded bg-gray-50 sm:h-auto sm:w-full dark:bg-gray-900">
        {item.description && (
          <button class="dark:bg-dark absolute hidden rounded-3xl bg-white px-1 text-teal-500 sm:top-3 sm:right-3 sm:block">
            <Tooltip label={item.description}>
              <i class="ti ti-info-circle" />
            </Tooltip>
          </button>
        )}
        <div class="aspect-square w-full">
          {item.imgSrc ? (
            <img
              src={item.imgSrc}
              alt={item.name}
              class="h-full w-full object-cover"
            />
          ) : (
            <div class="flex h-full w-full items-center justify-center">
              <i class="ti ti-bottle text-3xl text-gray-300 dark:text-gray-600" />
            </div>
          )}
        </div>
      </figure>

      {/* Content */}
      <section class="flex min-w-0 flex-1 flex-col justify-between gap-2 overflow-hidden p-2">
        <h3 class="truncate font-bold text-gray-700 sm:text-base dark:text-gray-300">
          {item.name}
        </h3>

        {item.description && (
          <p class="text-dimmed text-sm sm:hidden">
            <i class="ti ti-info-circle mr-1.5" />
            {item.description}
          </p>
        )}

        {/* Price and action */}
        <div
          class={`flex flex-1 flex-col justify-between gap-2 sm:flex-row sm:items-center sm:text-sm`}
        >
          <p class="text-dimmed font-mono text-xs font-semibold tabular-nums">
            <i class="ti ti-building-warehouse mr-1.5" />
            {item.stock > 0 ? <>{item.stock} Stück</> : "Leider aus"}
          </p>
          <button
            class={`btn-base self-start rounded-3xl border-2 px-3 py-2 text-xs tabular-nums ${cantBuy() ? "border-orange-500 text-orange-500" : "border-teal-500 text-teal-500"}`}
            onClick={purchaseMutation.mutate}
            disabled={cantBuy()}
          >
            <i class="ti ti-cash-register" hidden={toExpensive()} />
            <i class="ti ti-currency-euro-off" hidden={!toExpensive()} />
            {item.priceCents > 0 ? euro(item.priceCents) : "Gratis"}
          </button>
        </div>
      </section>
    </article>
  );
};

export default ItemView;
