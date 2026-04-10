import React, { useState } from "react";
import styles from "./Property.module.css";

interface PropertyProps {
  collectionId: number;
  collectionName: string;
  onEditSuccess: (newName: string) => void;
  onDeleteSuccess: () => void;
}

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

const Property: React.FC<PropertyProps> = ({
  collectionId,
  collectionName,
  onEditSuccess,
  onDeleteSuccess,
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(collectionName);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Обработчик удаления коллекции
  const handleDelete = async () => {
    try {
      const accessToken = getCookie("accessToken");
      const response = await fetch(
        `https://192.168.1.104:1026/collections/${collectionId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
      }

      setSnackbarMessage("Коллекция удалена");
      setShowSnackbar(true);
      setTimeout(() => {
        setShowSnackbar(false);
        onDeleteSuccess();
      }, 2000);
    } catch (error) {
      setSnackbarMessage(`Ошибка: ${(error as Error).message}`);
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 2000);
    }
  };

  // Обработчик редактирования коллекции
  const handleEdit = async () => {
    if (!newName.trim()) {
      setSnackbarMessage("Название коллекции не может быть пустым");
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 2000);
      return;
    }

    try {
        const accessToken = getCookie("accessToken");
      const response = await fetch(
        `https://192.168.1.104:1026/collections/${collectionId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ name: newName }),
        }
      );

      if (!response.ok) {
        throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
      }

      setSnackbarMessage("Отредактировано");
      setShowSnackbar(true);
      setTimeout(() => {
        setShowSnackbar(false);
        setIsEditing(false);
        onEditSuccess(newName);
      }, 2000);
    } catch (error) {
      setSnackbarMessage(`Ошибка: ${(error as Error).message}`);
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 3000);
    }
  };

  return (
    <div className={styles.propertyContainer}>
      <button
        className={styles.settingsButton}
        onClick={() => setShowOptions(!showOptions)}
      >
        ⚙️
      </button>

      {showOptions && (
        <div className={styles.optionsMenu}>
          <button
            className={styles.optionButton}
            onClick={() => {
              setIsEditing(true);
              setShowOptions(false);
            }}
          >
            Редактировать коллекцию
          </button>
          <button
            className={`${styles.optionButton} ${styles.deleteButton}`}
            onClick={handleDelete}
          >
            Удалить коллекцию
          </button>
        </div>
      )}

      {isEditing && (
        <div className={styles.editContainer}>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className={styles.editInput}
            autoFocus
          />
          <div className={styles.editButtons}>
            <button
              className={`${styles.editButton} ${styles.cancelButton}`}
              onClick={() => setIsEditing(false)}
            >
              Отмена
            </button>
            <button
              className={`${styles.editButton} ${styles.saveButton}`}
              onClick={handleEdit}
            >
              Сохранить
            </button>
          </div>
        </div>
      )}

      {showSnackbar && <div className={styles.snackbar}>{snackbarMessage}</div>}
    </div>
  );
};

export default Property;
