import EventEmitter from "node:events";

/**
 * Singleton manager for broadcasting messages across SSE connections.
 * Manages rooms with automatic cleanup when no listeners remain.
 */
export default class BroadcastManager {
  private static instance: BroadcastManager;
  private rooms = new Map<string, EventEmitter>();

  /**
   * Get the singleton instance of BroadcastManager.
   */
  static getInstance(): BroadcastManager {
    return (BroadcastManager.instance ??= new BroadcastManager());
  }

  private getRoom(roomId: string): EventEmitter {
    if (!this.rooms.has(roomId)) {
      const emitter = new EventEmitter();
      this.rooms.set(roomId, emitter);

      // Auto-cleanup when no listeners
      emitter.on("removeListener", () => {
        if (emitter.listenerCount("message") === 0) {
          this.rooms.delete(roomId);
        }
      });
    }
    return this.rooms.get(roomId)!;
  }

  /**
   * Broadcast a message to all subscribers in a room.
   *
   * @param roomId - The room to broadcast to
   * @param message - The message to send
   */
  broadcast(roomId: string, message: string): void {
    this.getRoom(roomId).emit("message", message);
  }

  /**
   * Subscribe to messages in a room.
   *
   * @param roomId - The room to subscribe to
   * @param callback - Function called when messages are received
   * @returns Unsubscribe function
   */
  subscribe(roomId: string, callback: (message: string) => void): () => void {
    const room = this.getRoom(roomId);
    room.on("message", callback);

    // Return unsubscribe function
    return () => room.off("message", callback);
  }
}
