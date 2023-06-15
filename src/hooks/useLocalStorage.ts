import { useState } from 'react';

type SetValue<T> = (value: T) => T;

export const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T | SetValue<T>) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.error(`Could not get local storage value: ${error}`);

      return initialValue;
    }
  });

  const setValue = (value: T | SetValue<T>) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      // Save state
      setStoredValue(valueToStore);
      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Could not set local storage value: ${error}`);
    }
  };

  return [storedValue, setValue];
};
