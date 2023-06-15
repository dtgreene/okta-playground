export function getStorageItem<T>(key: string, defaultValue: T) {
  try {
    const storage = window.localStorage.getItem(key);
    return (storage ? JSON.parse(storage) : defaultValue) as T;
  } catch (error) {
    console.error(`Could not get storage item: ${error}`);
    return defaultValue;
  }
}
