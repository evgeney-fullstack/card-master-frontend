import React from 'react';
import styles from './Buttons.module.css';

interface SignInButtonProps {
  onClick: () => void;
}

const SignInButton: React.FC<SignInButtonProps> = ({ onClick }) => {
  return (
    <button className={styles.signInButton} onClick={onClick}>
      Войти
    </button>
  );
};

export default SignInButton;