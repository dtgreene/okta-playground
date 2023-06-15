import styles from './LoadingIndicator.module.css';

export const LoadingIndicator = () => {
  return (
    <div className={styles.row}>
      <div className={styles.dot} />
      <div className={styles.dot} />
      <div className={styles.dot} />
    </div>
  );
};
