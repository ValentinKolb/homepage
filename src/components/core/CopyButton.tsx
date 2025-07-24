import { createClipboard } from "@/lib/solidjs/clipboard";
import type { Accessor, JSX } from "solid-js";

type CopyChildsProps = {
  copy: (text: string) => Promise<void>;
  wasCopied: Accessor<boolean>;
};

const CopyButton = (props: {
  children: (copyProps: CopyChildsProps) => JSX.Element;
}) => {
  const { copy, wasCopied } = createClipboard();

  return <>{props.children({ copy, wasCopied })}</>;
};

export default CopyButton;
