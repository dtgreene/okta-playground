import { useContext, useState, useEffect, useRef } from 'react';
import cx from 'classnames';

import { OktaContext } from '../contexts';

import styles from './Root.module.css';

export const Root = () => {
  const context = useContext(OktaContext);
  const { accessToken, signOut, refreshToken } = useContext(OktaContext);
  const [tokenExpiry, setTokenExpiry] = useState({
    minutes: 0,
    seconds: 0,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      const diffSeconds = Math.round(
        (accessToken?.expiresAt ?? 0) - Date.now() / 1000
      );
      const minutes = Math.floor(diffSeconds / 60);
      const seconds = Math.floor(diffSeconds % 60);

      setTokenExpiry({ minutes, seconds });
    }, 1000);
  }, [accessToken]);

  return (
    <div className={styles.container}>
      <div className={styles.title}>Okta Test</div>
      <div className={styles.expiryRow}>Token expires in {tokenExpiry.minutes}m {tokenExpiry.seconds}s</div>
      <div className={styles.btnRow}>
        <button
          className={cx(styles.btn, styles.filled)}
          onClick={context.refreshToken}
        >
          Refresh
        </button>
        <button
          className={cx(styles.btn, styles.outlined)}
          onClick={context.signOut}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};
