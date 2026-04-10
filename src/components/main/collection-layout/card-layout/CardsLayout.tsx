import React, { useState, useEffect, useRef } from "react";
import styles from "./CardsLayout.module.css";
import Property from "./property/Property";
import RepeatLayout from "./repeat-layout/RepeatLayout"; // Импортируем новый компонент

interface Card {
  id: number;
  user_id: number;
  collection_id: number;
  question: string;
  answer: string;
  repetition_stage: number;
  next_repeat_time: Date;
}

interface Collection {
  id: number;
  user_id: number;
  name: string;
}

interface CardsLayoutProps {
  collection: Collection;
  onBack: () => void;
  onCollectionDeleted: () => void; // Новый колбэк
  onCollectionUpdated: (newName: string) => void; // Новый колбэк
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

const CardsLayout: React.FC<CardsLayoutProps> = ({
  collection,
  onBack,
  onCollectionDeleted,
  onCollectionUpdated,
}) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const [createReverse, setCreateReverse] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  // Состояние для имени коллекции
  const [collectionName, setCollectionName] = useState(collection.name);
  const [cardToEdit, setCardToEdit] = useState<Card | null>(null);

  const [questionEdit, setQuestionEdit] = useState("");
  const [answerEdit, setAnswerEdit] = useState("");

  const [showActionsForCard, setShowActionsForCard] = useState<number | null>(
    null
  );
  const [showEditCardModal, setShowEditCardModal] = useState(false);
  const [longPress, setlongPress] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  //Обработчик сообщений Snackbar
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  //Обработчик сообщений кнопки повторения
  const [showRepeatLayout, setShowRepeatLayout] = useState(false);
  const [cardsToRepeat, setCardsToRepeat] = useState<Card[]>([]);

  const [showAnswer, setShowAnswer] = useState(false);

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

  const fetchCards = async (collectionId: number) => {
    try {
      setLoading(true);

      const accessToken = getCookie("accessToken");
      const response = await fetch(
        `https://192.168.1.104:1026/cards/${collectionId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          await tryRefreshToken();
          if (accessToken !== getCookie("accessToken")) {
            fetchCards(collectionId);
          }
        } else {
          throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
        }
      }

      const data = await response.json();

      if (data.data && Array.isArray(data.data)) {
        setCards(data.data);
      }
    } catch (err) {
      setError((err as Error).message || "Неизвестная ошибка");
      console.error("Ошибка при загрузке карточек:", err);
    } finally {
      setLoading(false);
    }
  };

  // Обновляем имя коллекции при изменении извне
  useEffect(() => {
    fetchCards(collection.id);
    setCollectionName(collection.name);
  }, [collection.name, collection.id]);

  // Обработчик успешного удаления коллекции
  const handleCollectionDeleted = () => {
    onCollectionDeleted();
    onBack();
  };

  // Обработчик успешного редактирования коллекции
  const handleCollectionUpdated = (newName: string) => {
    setCollectionName(newName);
    onCollectionUpdated(newName);
  };

  // Обработчик долгого нажатия
  const handleLongPressStart = (cardId: number) => {
    if(showAnswer){
    longPressTimer.current = setTimeout(() => {
      setShowActionsForCard(cardId);
      setlongPress(true);
    }, 1000); // 500ms для долгого нажатия
  }
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Обработчик переворота карточки
  const handleCardFlip = (cardId: number) => {
    if (!longPress) {
      setShowActionsForCard(null);
      if (flippedCards.includes(cardId)) {
        setFlippedCards(flippedCards.filter((id) => id !== cardId));
        setShowAnswer(true);
      } else {
        setFlippedCards([...flippedCards, cardId]);
        setShowAnswer(false);
      }
    }
    setlongPress(false);
  };

  // Открытие модального окна
  const openAddCardModal = () => {
    setShowAddCardModal(true);
  };

  // Закрытие модального окна
  const closeAddCardModal = () => {
    setShowAddCardModal(false);
    setQuestion("");
    setAnswer("");
    setCreateReverse(false);
  };

  const handleAddCard = (): void => {
    if (!question.trim() || !answer.trim()) {
      alert("Вопрос и ответ не могут быть пустыми");
      return;
    }
    handleAddCardTry();
  };
  // Обработчик добавления карточки
  const handleAddCardTry = async () => {
    try {
      setIsSubmitting(true);

      // Создаем основную карточку
      await createCard(question, answer);

      // Создаем обратную карточку, если выбрана опция
      if (createReverse) {
        await createCard(answer, question);
      }

      // Закрываем модальное окно и сбрасываем состояние
      closeAddCardModal();

      const accessToken = getCookie("accessToken");
      const response = await fetch(
        `https://192.168.1.104:1026/cards/${collection.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          await tryRefreshToken();
          if (accessToken !== getCookie("accessToken")) {
            handleAddCardTry();
          }
        } else {
          throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
        }
      } else {
        const data = await response.json();
        setCards(data.data || []);
      }
    } catch (err) {
      alert(`Ошибка при добавлении карточки: ${(err as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Функция создания карточки
  const createCard = async (question: string, answer: string) => {
    const accessToken = getCookie("accessToken");
    const response = await fetch(
      `https://192.168.1.104:1026/cards/${collection.id}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          question,
          answer,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        await tryRefreshToken();
        if (accessToken !== getCookie("accessToken")) {
          createCard(question, answer);
        }
      } else {
        throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
      }
    } else {
      return response.json();
    }
  };

  // Фильтрация карточек по поисковому запросу
  const filteredCards = cards.filter(
    (card) =>
      card.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (cardId: number): void => {
    if (!questionEdit.trim() || !answerEdit.trim()) {
      setError("Вопрос и ответ не могут быть пустыми");
      return;
    }
    handleSubmitTry(cardId);
  };

  //Обработчик редактирования карточки
  const handleSubmitTry = async (cardId: number) => {
    try {
      setIsSubmittingEdit(true);
      setError("");

      const accessToken = getCookie("accessToken");
      const response = await fetch(
        `https://192.168.1.104:1026/cards/${cardId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            question: questionEdit,
            answer: answerEdit,
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          await tryRefreshToken();
          if (accessToken !== getCookie("accessToken")) {
            handleSubmitTry(cardId);
          }
        } else {
          throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
        }
      } else {
        setSnackbarMessage("Карточка отредактирована");
        setShowSnackbar(true);
        setTimeout(() => {
          setShowSnackbar(false);
          // setIsEditing(false);
        }, 2000);

        handleCardUpdated();
        setShowEditCardModal(false);
      }
      //  onClose();
    } catch (err) {
      setSnackbarMessage(`Ошибка: ${(err as Error).message}`);
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 3000);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  /**
   * Инициирует удаление карты после подтверждения пользователем.
   * Показывает диалоговое окно с текстом "Вы точно хотите удалить эту карту?"
   * Вызывает callback onDeleteConfirmed только при подтверждении.
   */
  const handleDeleteCardWithConfirmation = (cardId: number): void => {
    if (window.confirm("Вы точно хотите удалить эту карту?")) {
      handleDeleteCard(cardId);
    }
  };

  // Обработчик удаления карточки
  const handleDeleteCard = async (cardId: number) => {
    try {
      const accessToken = getCookie("accessToken");
      const response = await fetch(
        `https://192.168.1.104:1026/cards/${cardId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          await tryRefreshToken();
          if (accessToken !== getCookie("accessToken")) {
            handleDeleteCard(cardId);
          }
        } else {
          throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
        }
      } else {
        setSnackbarMessage("Карточка удалена");
        setShowSnackbar(true);
        setTimeout(() => {
          setShowSnackbar(false);
          // setIsEditing(false);
        }, 2000);

        try {
          const responseNew = await fetch(
            `https://192.168.1.104:1026/cards/${collection.id}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          if (responseNew.ok) {
            const data = await responseNew.json();
            setCards(data.data || []);
          }
        } catch (err) {
          alert(`Ошибка при добавлении карточки: ${(err as Error).message}`);
        }
      }
    } catch (error) {
      setSnackbarMessage(`Ошибка: ${(error as Error).message}`);
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 3000);
    }
  };

  // Обработчик открытия редактора карточки
  const handleEditCard = (card: Card) => {
    setQuestionEdit(card.question);
    setAnswerEdit(card.answer);

    setCardToEdit(card);
    setShowEditCardModal(true);
    setShowActionsForCard(null);
  };

  // Обработчик успешного обновления карточки
  const handleCardUpdated = async () => {
    const accessToken = getCookie("accessToken");
    try {
      const responseNew = await fetch(
        `https://192.168.1.104:1026/cards/${collection.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!responseNew.ok) {
        if (responseNew.status === 401) {
          await tryRefreshToken();
          if (accessToken !== getCookie("accessToken")) {
            handleCardUpdated();
          }
        } else {
          throw new Error(
            `Ошибка ${responseNew.status}: ${responseNew.statusText}`
          );
        }
      } else {
        const data = await responseNew.json();
        setCards(data.data || []);
      }
    } catch (err) {
      alert(`Ошибка при добавлении карточки: ${(err as Error).message}`);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}>Загрузка карточек...</div>
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

  const handleStartRepeat = async () => {
    try {
      const accessToken = getCookie("accessToken");
      const response = await fetch(
        `https://192.168.1.104:1026/repeat/${collection.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          await tryRefreshToken();
          if (accessToken !== getCookie("accessToken")) {
            handleStartRepeat();
          }
        } else {
          throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
        }
      } else {
        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
          setCardsToRepeat(data.data);
          setShowRepeatLayout(true);
        } else {
          throw new Error("Неверный формат данных карточек для повторения");
        }
      }
    } catch (error) {
      setSnackbarMessage(`Ошибка: ${(error as Error).message}`);
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 3000);
    }
  };

  // Если открыт режим повторения
  if (showRepeatLayout) {
    return (
      <RepeatLayout
        cards={cardsToRepeat}
        collectionName={collection.name}
        collectionId={collection.id}
        onBack={() => setShowRepeatLayout(false)}
        onCardUpdated={handleCardUpdated}
      />
    );
  }

  return (
    <div className={styles.cardsLayoutContainer}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={onBack}>
          &larr; Назад
        </button>

        {filteredCards.length === 0 ? (
          <button className={`${styles.repeatButton} ${styles.noCards}`}>
            Повторить
          </button>
        ) : (
          <button className={styles.repeatButton} onClick={handleStartRepeat}>
            Повторить
          </button>
        )}

        <h1 className={styles.title}>{collectionName}</h1>

        <Property
          collectionId={collection.id}
          collectionName={collectionName}
          onEditSuccess={handleCollectionUpdated}
          onDeleteSuccess={handleCollectionDeleted}
        />
      </div>

      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Поиск карточек..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.cardsContainer}>
        {filteredCards.length === 0 ? (
          <div className={styles.emptyState}>
            <p>У вас нет карточек в этой коллекции</p>
          </div>
        ) : (
          <div className={styles.cardsList}>
            {filteredCards.map((card) => (
              <div
                key={card.id}
                className={`${styles.card} ${
                  flippedCards.includes(card.id) ? styles.flipped : ""
                }`}
                onClick={() => handleCardFlip(card.id)}
                onMouseDown={() => handleLongPressStart(card.id)}
                onMouseUp={handleLongPressEnd}
                onMouseLeave={handleLongPressEnd}
                onTouchStart={() => handleLongPressStart(card.id)}
                onTouchEnd={handleLongPressEnd}
              >
                <div className={styles.cardFront}>
                  <div className={styles.cardContent}>
                    <p>{card.question}</p>
                  </div>
                </div>
                <div className={styles.cardBack}>
                  <div className={styles.cardContent}>
                    <p>{card.answer}</p>
                  </div>
                </div>

                {showActionsForCard === card.id && (
                  <div
                    className={styles.cardActions}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className={styles.actionButton}
                      onClick={() => handleEditCard(card)}
                    >
                      ✏️
                    </button>
                    <button
                      className={`${styles.actionButton} ${styles.deleteAction}`}
                      onClick={() => handleDeleteCardWithConfirmation(card.id)}
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <button className={styles.addCardButton} onClick={openAddCardModal}>
        + Добавить карточку
      </button>

      {/* Модальное окно добавления карточки */}
      {showAddCardModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Создать новую карточку</h2>

            <div className={styles.formGroup}>
              <label htmlFor="question">Вопрос:</label>
              <textarea
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className={styles.inputField}
                rows={3}
                placeholder="Введите вопрос"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="answer">Ответ:</label>
              <textarea
                id="answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className={styles.inputField}
                rows={3}
                placeholder="Введите ответ"
              />
            </div>

            <div className={styles.checkboxGroup}>
              <input
                type="checkbox"
                id="createReverse"
                checked={createReverse}
                onChange={(e) => setCreateReverse(e.target.checked)}
                className={styles.checkboxInput}
              />
              <label htmlFor="createReverse">Создать обратную карточку</label>
            </div>

            <div className={styles.modalButtons}>
              <button
                className={`${styles.modalButton} ${styles.cancelButton}`}
                onClick={closeAddCardModal}
                disabled={isSubmitting}
              >
                Отмена
              </button>
              <button
                className={`${styles.modalButton} ${styles.submitButton}`}
                onClick={handleAddCard}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Создание..." : "Создать"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Модальное окно редактирования карточки */}
      {showEditCardModal && cardToEdit && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Редактор карточки</h2>

            {error && <div className={styles.errorText}>{error}</div>}

            <div className={styles.formGroup}>
              <label htmlFor="editQuestion">Вопрос:</label>
              <textarea
                id="editQuestion"
                value={questionEdit}
                onChange={(e) => setQuestionEdit(e.target.value)}
                className={styles.inputField}
                rows={3}
                placeholder="Введите вопрос"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="editAnswer">Ответ:</label>
              <textarea
                id="editAnswer"
                value={answerEdit}
                onChange={(e) => setAnswerEdit(e.target.value)}
                className={styles.inputField}
                rows={3}
                placeholder="Введите ответ"
              />
            </div>

            <div className={styles.modalButtons}>
              <button
                className={`${styles.modalButton} ${styles.cancelButton}`}
                onClick={() => setShowEditCardModal(false)}
                disabled={isSubmittingEdit}
              >
                Отмена
              </button>
              <button
                className={`${styles.modalButton} ${styles.submitButton}`}
                onClick={() => handleSubmit(cardToEdit.id)}
                disabled={isSubmittingEdit}
              >
                {isSubmittingEdit ? "Сохранение..." : "Редактировать"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSnackbar && <div className={styles.snackbar}>{snackbarMessage}</div>}
    </div>
  );
};

export default CardsLayout;
