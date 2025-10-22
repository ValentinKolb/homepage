import QrCreator from "qr-creator";
import { createEffect, onMount } from "solid-js";

export type QRCodeConfig = QrCreator.Config;

export function QRCode(props: {
  text: () => string;
  config?: () => QRCodeConfig;
}) {
  let canvasRef: HTMLCanvasElement | undefined;

  const renderQR = () => {
    if (!canvasRef) return;

    QrCreator.render(
      {
        text: props.text(),
        radius: 0.3,
        ecLevel: "L",
        fill: "oklch(62.3% 0.214 259.815)",
        background: "transparent",
        size: 128,
        ...props.config?.(),
      },
      canvasRef,
    );
  };

  onMount(() => renderQR());

  createEffect(() => {
    props.text();
    renderQR();
  });

  return <canvas ref={canvasRef} />;
}
