/// <reference path="../.astro/types.d.ts" />
/// <reference types="@astrojs/image/client" />

// astro-bun-websocket types
declare namespace App {
  interface Locals {
    /**
     * Whether the current request wants the connection to be upgraded
     * to a WebSocket.
     */
    isUpgradeRequest: boolean;

    /**
     * Upgrade an incoming HTTP request to a bidirectional WebSocket
     * connection.
     */
    upgradeWebSocket(): { socket: WebSocket; response: Response };
  }
}

// astro-bun-websocket types
declare namespace App {
  interface Locals {
    /**
     * Whether the current request wants the connection to be upgraded
     * to a WebSocket.
     */
    isUpgradeRequest: boolean;

    /**
     * Upgrade an incoming HTTP request to a bidirectional WebSocket
     * connection.
     */
    upgradeWebSocket(): { socket: WebSocket; response: Response };
  }
}
