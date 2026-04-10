import React, { useState, useEffect } from "react";
import styles from "./CollectionsLayout.module.css";
import CardsLayout from "./card-layout/CardsLayout";

interface Collection {
  id: number;
  user_id: number;
  name: string;
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

const CollectionsLayout: React.FC = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] =
    useState<Collection | null>(null);

  // Обработчик удаления коллекции
  const handleCollectionDeleted = () => {
    fetchCollections();
  };

  // Обработчик обновления коллекции
  const handleCollectionUpdated = (collectionId: number, newName: string) => {
    setCollections(
      collections.map((coll) =>
        coll.id === collectionId ? { ...coll, name: newName } : coll
      )
    );
  };

  const fetchCollections = async () => {
    try {
      const accessToken = getCookie("accessToken");

      setLoading(true);

      const response = await fetch("https://192.168.1.104:1026/collections/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      // Обработка новой структуры данных
      if (data.data && Array.isArray(data.data)) {
        setCollections(data.data);
      }
    } catch (err) {
      setError((err as Error).message || "Неизвестная ошибка");
      console.error("Ошибка при загрузке коллекций:", err);
    } finally {
      setLoading(false);
    }
  };
  // Загрузка коллекций
  useEffect(() => {
    fetchCollections();
  }, []);

  const handleAddCollectionWithConfirmation = (): void => {
    const collectionName = prompt("Введите название новой коллекции:");
    if (!collectionName) return;
    handleAddCollection(collectionName);
  };

  // Функция для добавления новой коллекции
  const handleAddCollection = async (collectionName: string) => {
    try {
      const accessToken = getCookie("accessToken");
      setLoading(true);
      const response = await fetch("https://192.168.1.104:1026/collections/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name: collectionName }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          await tryRefreshToken();
          if (accessToken !== getCookie("accessToken")) {
            handleAddCollection(collectionName);
          }
        } else {
          throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
        }
      } else {
        fetchCollections();
      }
    } catch (err) {
      setError((err as Error).message || "Неизвестная ошибка");
      console.error("Ошибка при добавлении коллекции:", err);
    } finally {
      setLoading(false);
    }
  };

  // Обработчик выбора коллекции
  const handleCollectionSelect = (collection: Collection) => {
    setSelectedCollection(collection);
  };

  // Если выбрана коллекция, показываем CardsLayout
  if (selectedCollection) {
    return (
      <CardsLayout
        collection={selectedCollection}
        onBack={() => setSelectedCollection(null)}
        onCollectionDeleted={handleCollectionDeleted}
        onCollectionUpdated={(newName) =>
          handleCollectionUpdated(selectedCollection.id, newName)
        }
      />
    );
  }

  // Функция для установки токенов в куки
  const setTokens = (accessToken: string) => {
    document.cookie = `accessToken=${accessToken}; path=/`;
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
        await setTokens(data.access_token);
      } else {
        throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      setError((error as Error).message || "Неизвестная ошибка");
      console.error("Ошибка при обновлении токена:", error);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}>Загрузка коллекций...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>Ошибка: {error}</p>
        <button
          className={styles.retryButton}
          onClick={() => window.location.reload()}
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className={styles.layoutContainer}>
      <h1 className={styles.title}>Мои коллекции</h1>

      <div className={styles.collectionsGrid}>
        {collections.map((collection) => (
          <button
            key={collection.id}
            className={styles.collectionButton}
            onClick={() => handleCollectionSelect(collection)}
          >
            {collection.name}
          </button>
        ))}

        <button
          className={`${styles.collectionButton} ${styles.addCollectionButton}`}
          onClick={handleAddCollectionWithConfirmation}
        >
          + Добавить коллекцию
        </button>
      </div>
    </div>
  );
};

export default CollectionsLayout;
