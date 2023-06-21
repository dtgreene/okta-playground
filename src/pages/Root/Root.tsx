import { useContext, useState, useEffect, useRef } from 'react';
import cx from 'classnames';
import { produce } from 'immer';

import styles from './Root.module.css';

import { useLocalStorage } from 'app/hooks';
import { EXPIRE_SECONDS, STORAGE_KEY } from 'app/constants';
import { PlaygroundStorage } from 'app/types';
import { OktaContext } from 'app/contexts';

type ExpireTime = { minutes: number; seconds: number };

export const Root = () => {
  const pendingReload = useRef(false);
  const { accessToken, signOut } = useContext(OktaContext);
  const [expireTime, setExpireTime] = useState<ExpireTime>({
    minutes: 0,
    seconds: 0,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [storage, setStorage] = useLocalStorage<PlaygroundStorage>(
    STORAGE_KEY,
    {}
  );

  useEffect(() => {
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      const expiresAt = accessToken?.expiresAt ?? 0;
      const diffMillis = Math.round(expiresAt * 1000 - Date.now());

      const { minutes, seconds } = formatMillis(diffMillis);

      setExpireTime({ minutes, seconds });
    }, 1000);
  }, [accessToken]);

  const handleExpiryChange = () => {
    if (!pendingReload.current) {
      setStorage(
        produce((draft) => {
          if (draft.expireEarly !== undefined) {
            draft.expireEarly = !draft.expireEarly;
          } else {
            draft.expireEarly = true;
          }
        })
      );

      // Reload the page to enforce the change
      setTimeout(() => {
        window.location.reload();
      }, 200);

      pendingReload.current = true;
    }
  };

  const isExpireEarly = Boolean(storage.expireEarly);
  const earlyExpireDisplay = isExpireEarly
    ? getEarlyExpire(expireTime)
    : 'None';

  return (
    <div className={styles.container}>
      <div className={styles.title}>Okta Test</div>
      <div className={styles.infoContainer}>
        <div className={styles.infoBox}>
          <div className={styles.info}>
            <span>Expires at</span>
            <span>
              {expireTime.minutes}m {expireTime.seconds}s
            </span>
          </div>
          <div className={styles.info}>
            <span>Expires at (early)</span>
            <span>{earlyExpireDisplay}</span>
          </div>
          <div className={styles.info}>
            <span>Expire Early</span>
            <input
              type="checkbox"
              checked={isExpireEarly}
              onChange={handleExpiryChange}
            />
          </div>
        </div>
      </div>
      <div className={styles.btnRow}>
        <button className={cx(styles.btn, styles.outlined)} onClick={signOut}>
          Sign Out
        </button>
      </div>
    </div>
  );
};

function getEarlyExpire(expireTime: ExpireTime) {
  const earlyMillis = EXPIRE_SECONDS.early * 1000;
  const expireMillis = (expireTime.minutes * 60 + expireTime.seconds) * 1000;
  const diffMillis = expireMillis - earlyMillis;

  if (diffMillis > 0) {
    const { minutes, seconds } = formatMillis(diffMillis);

    return `${minutes}m ${seconds}s`;
  } else {
    return '0m 0s';
  }
}

function formatMillis(millis: number) {
  const dateTime = new Date(millis).toISOString().slice(11, 19);
  const output = dateTime.split(':');
  const minutes = Math.max(output[1] ? Number(output[1]) : 0, 0);
  const seconds = Math.max(output[2] ? Number(output[2]) : 0, 0);

  return { minutes, seconds };
}
