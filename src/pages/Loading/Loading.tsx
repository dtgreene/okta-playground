import { LoadingIndicator } from 'app/components';

import styles from './Loading.module.css';

interface ILoadingProps {
  message?: string;
}

export const Loading = ({ message }: ILoadingProps) => (
  <div className={styles.container}>
    {message && <div className={styles.text}>{message}</div>}
    <LoadingIndicator />
  </div>
);
