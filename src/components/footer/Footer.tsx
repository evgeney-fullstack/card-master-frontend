import React from 'react';
import styles from './Footer.module.css';

const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <p>© 2025 Моё приложение. Все права защищены.</p>
    </footer>
  );
};

export default Footer;