export interface TokenStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const noopStorage: TokenStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined
};

export const createBrowserStorage = (): TokenStorage => {
  if (typeof window === "undefined" || !window.localStorage) {
    return noopStorage;
  }

  return {
    getItem: (key) => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
    removeItem: (key) => window.localStorage.removeItem(key)
  };
};
