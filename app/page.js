import Image from 'next/image'
import styles from './page.module.css'

export default function Home() {
  return (
    <div>
      <nav className={styles.navbar}>
        <h1>My App</h1>
      </nav>
      <div className={styles.container}>
        <div className={styles.column}>
          <div className={styles.fortyFivePercentLine}>Line 1 (45%)</div>
          <div className={styles.tenPercentLine}>Line 2 (10%)</div>
          <div className={styles.fortyFivePercentLine}>Line 3 (45%)</div>
        </div>
        <div className={styles.column}>
          <div className={styles.sixtyPercentLine}>Line 2 (60%)</div>
          <div className={styles.fortyPercentLine}>Line 2 (40%)</div>
        </div>
        <div className={styles.column}>
          <div className={styles.halfLine}>Line 3 (1st half)</div>
          <div className={styles.halfLine}>Line 3 (2nd half)</div>
        </div>
      </div>
    </div>
  );
}
