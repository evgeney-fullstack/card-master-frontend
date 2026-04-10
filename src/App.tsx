import React, { useState, useEffect } from "react";

import styles from "./App.module.css";
import Header from "./components/header/Header";
import Footer from "./components/footer/Footer";
import AuthForm from "./components/auth/components/AuthForm";
import CollectionsLayout from "./components/main/collection-layout/CollectionsLayout";


// Функция для получения значения куки по имени
const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;

  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(";").shift();
    return cookieValue ? cookieValue : null;
  }
  return null;
};

const App: React.FC = () => {
  const [authFormVisible, setAuthFormVisible] = useState(false);
  
  const [userName, setUserName] = useState("");
  const [formType, setFormType] = useState<"login" | "register">("login");
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Состояние авторизации
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); // Добавляем состояние проверки авторизации

  // Проверяем авторизацию при загрузке
  useEffect(() => {
    
    const checkAuthStatus = async () => {
      try {
        const accessToken = getCookie("accessToken");
        // Если токен есть, проверяем его валидность
        if (accessToken) {
          // Отправляем запрос на сервер для проверки токена
          const response = await fetch(
            "https://192.168.1.104:1026/auth/validate",
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );


          if (response.ok) {           
            console.log(userName);
            setIsLoggedIn(true);
          } else {
            // Если токен невалиден, пытаемся обновить с помощью refresh token
            await tryRefreshToken();
          }
        }
      } catch (error) {
        console.error("Ошибка при проверке авторизации:", error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    const tryRefreshToken = async () => {
      try {
        const refreshToken = getCookie("refreshToken");
        if (!refreshToken) return;

        const response = await fetch(
          "https://192.168.1.104:1026/auth/refresh-token",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setTokens(data.access_token);
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error("Ошибка при обновлении токена:", error);
      }
    };

    // Функция для установки токенов в куки
    const setTokens = (accessToken: string) => {
      document.cookie = `accessToken=${accessToken}; path=/`;
    };

    checkAuthStatus();
  }, []);

  const handleSignInClick = () => {
    
    setFormType("login");
    setAuthFormVisible(true);
  };

  const handleSignUpClick = () => {
    setFormType("register");
    setAuthFormVisible(true);
  };

  const handleCloseForm = () => {
    setAuthFormVisible(false);
  };

  const handleGetUserName = (userName:string) => {   
    setUserName(userName);
  };


  // Обработчик успешного входа
  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    // Здесь можно добавить другие действия после входа
    // Например, перенаправление, обновление UI и т.д.
  };

  // Обработчик успешного входа
  const handleLogoutClick = () => {
    setIsLoggedIn(false);
    // Здесь можно добавить другие действия после входа
    // Например, перенаправление, обновление UI и т.д.
  };

  // Пока проверяем авторизацию, показываем загрузку
  if (isCheckingAuth) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}>Загрузка...</div>
      </div>
    );
  }

  return (
    <div className={styles.appContainer}>
      {authFormVisible && <div className={styles.overlay} />}

      <Header
        onUsername={userName}
        onSignInClick={handleSignInClick}
        onSignUpClick={handleSignUpClick}
        onLogoutClick={handleLogoutClick}
        isLoggedIn={isLoggedIn} // Передаем состояние входа в Header
      />

      <main className={styles.mainContent}>
        {isLoggedIn ? (
          <CollectionsLayout />
        ) : (
          <div className={styles.guestMessage}>
            <h1>Добро пожаловать!</h1>
            <p>Пожалуйста, войдите или зарегистрируйтесь.</p>
          </div>
        )}
      </main>

      <Footer />

      <AuthForm
        getUserName={handleGetUserName}
        isVisible={authFormVisible}
        formType={formType}
        onClose={handleCloseForm}
        onLoginSuccess={handleLoginSuccess} // Передаем колбэк
      />
    </div>
  );
};

export default App;
