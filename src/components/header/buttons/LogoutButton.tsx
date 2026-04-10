import React from "react";
import styles from "./Buttons.module.css";

interface LogoutButtonProps {
  onClick: () => void;
}

  // Функция выхода
  const deleteTokensInCookie= () => {
    // Удаляем токены из кук
    document.cookie = 'accessToken=; path=/;';
    document.cookie = 'refreshToken=; path=/;';
  };

const LogoutButton: React.FC<LogoutButtonProps> = ({ onClick }) => {


  const handleLogout = async (e: React.FormEvent) => {
  e.preventDefault();

  const refreshToken: string = 'Bearer '+document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("refreshToken="))
    ?.split("=")[1]|| '';

  // Формируем URL в зависимости от типа формы
  const url = "https://192.168.1.104:1026/auth/logout";

  try {
    // Отправляем POST-запрос
    const response = await fetch(url, {
      method: "POST",
      headers: {
        'Authorization': refreshToken,
      },
    });

    // Проверяем статус ответа
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Ошибка сервера");
    }

    const data = await response.json();

    console.log(data);
    onClick();

    deleteTokensInCookie();



  } catch (err) {
    console.error("Ошибка при отправке запроса:", err);
  } 
  
};
  
  return (
    <button className={styles.logoutButton} onClick={handleLogout}>
      Выйти
    </button>
  );
};

export default LogoutButton;
