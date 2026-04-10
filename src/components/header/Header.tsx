import React from 'react';

import styles from './Header.module.css';
import SignInButton from './buttons/SignInButton';
import SignUpButton from './buttons/SignUpButton';
import LogoutButton from './buttons/LogoutButton';

interface HeaderProps {
  onUsername: string;
  onSignInClick: () => void;
  onSignUpClick: () => void;
  onLogoutClick: () => void;
  isLoggedIn: boolean; // Добавляем состояние входа

}

const Header: React.FC<HeaderProps> = ({ 
  onUsername,
  onSignInClick, 
  onSignUpClick,
  onLogoutClick,
  isLoggedIn
}) => {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>Логотип</div>
      
      <div className={styles.authButtons}>
        {isLoggedIn ? (
          <div className={styles.userInfo}>
            <span>{onUsername}</span>
            {/* <button className={styles.logoutButton}>Выйти</button> */}
            <LogoutButton onClick={onLogoutClick} />
          </div>
        ) : (
          <>
            <SignInButton onClick={onSignInClick} />
            <SignUpButton onClick={onSignUpClick} />
          </>
        )}
      </div>
    </header>
  );
};

export default Header;