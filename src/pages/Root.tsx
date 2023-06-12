import { useContext } from 'react';
import cx from 'classnames';

import { OktaContext } from '../contexts';

import styles from './Root.module.css';

export const Root = () => {
  const context = useContext(OktaContext);

  return (
    <div className={styles.container}>
      <div className={styles.title}>Okta Test</div>
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
