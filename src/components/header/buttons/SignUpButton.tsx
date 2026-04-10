import React from 'react';
import styles from './Buttons.module.css';

interface SignUpButtonProps {
  onClick: () => void;
}

const SignUpButton: React.FC<SignUpButtonProps> = ({ onClick }) => {
  return (
    <button className={styles.signUpButton} onClick={onClick}>
      Регистрация
    </button>
  );
};

export default SignUpButton;