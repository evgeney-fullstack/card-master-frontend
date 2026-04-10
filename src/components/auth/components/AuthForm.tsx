import React, { useState, useEffect } from 'react';
import styles from "./AuthForm.module.css";
import eyeIconOpen from './eye-open.svg';
import eyeIconClose from './eye-closed.svg';
interface AuthFormProps {
  getUserName: (userName:string) => void;
  isVisible: boolean;
  formType: "login" | "register";
  onClose: () => void;
  onLoginSuccess: () => void; // Добавляем колбэк для успешного входа
}

interface AuthResponse {
  user_name: string;
  access_token: string;
  refresh_token: string;
}

const AuthForm: React.FC<AuthFormProps> = ({
  getUserName,
  isVisible,
  formType,
  onClose,
  onLoginSuccess
}) => {
  const [email, setEmail] = useState("");
  const [password_hash, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

    // Состояния для видимости пароля
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
  if (formType === 'register' && confirmPassword && password_hash !== confirmPassword) {
    setPasswordError('Пароли не совпадают');
  } else {
    setPasswordError(null);
  }
}, [password_hash, confirmPassword, formType]);

  const onCloseAndReset = ()=>{
      // Закрываем форму после успешной операции
      onClose();
      
      // Сбрасываем поля формы
      setEmail('');
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
  }

    // Функция для сохранения токенов в куки
  const setTokens = (accessToken: string, refreshToken: string) => {
    document.cookie = `accessToken=${accessToken}; path=/`;
    document.cookie = `refreshToken=${refreshToken}; path=/`;
  };
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Проверка совпадения паролей для регистрации
    if (formType === 'register' && password_hash !== confirmPassword) {
      setPasswordError('Пароли не совпадают');
      return;
    }
    
    // Формируем URL в зависимости от типа формы
    const url = formType === 'register' 
      ? 'https://192.168.1.104:1026/auth/sign-up' 
      : 'https://192.168.1.104:1026/auth/sign-in';

    try {
      setIsLoading(true);
      
      // Отправляем POST-запрос
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,          
          password_hash,
          username
        }),
      });

      // Проверяем статус ответа
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка сервера');
      }


      // Парсим успешный ответ
      const data: AuthResponse = await response.json();
      
      getUserName(data.user_name);
            // Для входа сохраняем токены в куки
      if (formType === 'login') {        
        setTokens(data.access_token, data.refresh_token);        
        onLoginSuccess(); // Вызываем колбэк успешного входа
      }

      // Закрываем форму после успешной операции
      onClose();
      
      // Сбрасываем поля формы
      setEmail('');
      setUsername('');
      setPassword('');
      setConfirmPassword('');

      console.log(`${formType === 'register' ? 'Регистрация' : 'Вход'} успешен!`);
        
    } catch (err) {
      // Обработка ошибок
      const errorMessage = (err as Error).message || 'Неизвестная ошибка';
      setError(`Ошибка: ${errorMessage}`);
      console.error('Ошибка при отправке запроса:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className={styles.authFormContainer}>
      <form
        className={styles.authForm}
        onSubmit={handleSubmit}
      >
        <h2>{formType === "login" ? "Вход" : "Регистрация"}</h2>
                
        {error && <div className={styles.errorMessage}>{error}</div>}


        {formType === "register" && (
          <div className={styles.formGroup}>
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
        )}
        <div className={styles.formGroup}>
          <label htmlFor="username">Логин:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="password">Пароль:</label>
         <div className={styles.passwordContainer}>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password_hash}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
            <button
              type="button"
              className={styles.togglePassword}
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              <img 
                src={showPassword ? eyeIconOpen : eyeIconClose} 
                alt={showPassword ? "Скрыть пароль" : "Показать пароль"} 
                className={styles.eyeIcon}
              />
            </button>
          </div>
        </div>

        {formType === "register" && (
          <>
          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">Подтвердите пароль:</label>
            <div className={styles.passwordContainer}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                <img 
                  src={showConfirmPassword ? eyeIconOpen: eyeIconClose} 
                  alt={showConfirmPassword ? "Скрыть пароль" : "Показать пароль"} 
                  className={styles.eyeIcon}
                />
              </button>
            </div>
          </div>
           {passwordError && (
              <div className={styles.passwordError}>
                {passwordError}
              </div>
            )}
          </>          
        )}

        <div className={styles.buttonGroup}>
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isLoading || (formType === 'register' && passwordError !== null)}

          >
            {isLoading ? 'Отправка...' : formType === 'login' ? 'Войти' : 'Регистрация'}
          </button>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onCloseAndReset}
            disabled={isLoading}
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
};

export default AuthForm;
