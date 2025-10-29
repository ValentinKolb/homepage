/**
 * Kit Dialog API
 *
 * Simple wrappers around prompt-lib for user interactions
 */

import { prompts } from "@/lib/client/prompt-lib";

export const createDialogAPI = () => ({
  form: (fields: any) =>
    prompts.form({
      title: "Kit Formular",
      icon: "ti ti-tool",
      fields,
    }),

  prompt: (message: string, defaultValue?: string) =>
    prompts.prompt(message, defaultValue, {
      title: "Kit Dialog",
      icon: "ti ti-tool",
    }),

  promptNumber: (message: string, defaultValue?: number) =>
    prompts.promptNumber(message, defaultValue, {
      title: "Kit Dialog",
      icon: "ti ti-tool",
    }),

  alert: (message: string) =>
    prompts.alert(message, {
      title: "Kit Dialog",
      icon: "ti ti-tool",
    }),

  confirm: (message: string) =>
    prompts.confirm(message, {
      title: "Kit Dialog",
      icon: "ti ti-tool",
    }),
});
