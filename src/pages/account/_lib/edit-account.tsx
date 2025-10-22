import ImageInput from "@/components/solidjs/input/image";
import TextInput from "@/components/solidjs/input/text";
import { prompts } from "@/lib/client/prompt-lib";
import { createMutation } from "@/lib/solidjs/mutation";
import { actions } from "astro:actions";
import { createStore } from "solid-js/store";

const EditAccount = (inital: { username: string; imgSrc: string | null }) => {
  const [user, setUser] = createStore({
    username: inital.username,
    imgSrc: inital.imgSrc,
  });
  const [updated, setUpdated] = createStore({
    username: inital.username,
    imgSrc: inital.imgSrc,
  });

  const updateMutation = createMutation({
    mutation: async () => {
      return await actions.auth.user.update.orThrow({
        username: updated.username,
        img_data: updated.imgSrc !== user.imgSrc ? updated.imgSrc : undefined,
      });
    },
    onError: () => {
      prompts.error("Speichern fehlgeschlagen. Bitte versuche es erneut.");
    },
    onSuccess: () => {
      setUser(updated);
      const el = document.getElementById("username");
      el && (el.textContent = updated.username);
    },
  });

  return (
    <section class="flex flex-col gap-4">
      {/* Profile image */}
      <ImageInput
        round
        ariaLabel="Profile Image"
        value={() => updated.imgSrc}
        onChange={(value) => setUpdated("imgSrc", value)}
      />

      {/* Username */}
      <TextInput
        label="Anzeigename"
        description="Dein Anzeigename kann frei gewählt werden. Der Name und das Profilbild sind öffentlich für andere sichtbar."
        value={() => updated.username}
        onInput={(value) => {
          setUpdated("username", value);
        }}
        icon="ti ti-at"
      />

      {(updated.username !== user.username ||
        updated.imgSrc !== user.imgSrc) && (
        <button
          class="btn-primary dark:btn-subtle group self-start p-2 dark:hover:text-blue-500"
          onClick={updateMutation.mutate}
          disabled={updateMutation.loading()}
        >
          <i class="ti ti-device-floppy group-hover:hidden" />
          <i class="ti ti-cloud-upload hidden group-hover:block" />
          Speichern
        </button>
      )}
    </section>
  );
};

export default EditAccount;
