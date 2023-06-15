import styles from './LoggedOut.module.css';

export const LoggedOut = () => (
  <div className={styles.container}>
    <div className={styles.text}>You are now logged out!</div>
    <div className={styles.linkRow}>
      <a className={styles.link} href="/">
        Click here to go back home
      </a>
    </div>
  </div>
);
