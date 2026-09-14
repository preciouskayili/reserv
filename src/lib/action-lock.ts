// The lock is acquired synchronously, before React can render disabled controls.
export function createActionLock() {
  let locked = false;
  return {
    async run(action: () => Promise<boolean>): Promise<boolean> {
      if (locked) return false;
      locked = true;
      try { return await action(); }
      finally { locked = false; }
    },
  };
}
