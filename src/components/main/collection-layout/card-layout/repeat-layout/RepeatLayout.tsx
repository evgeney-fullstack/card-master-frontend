import React, { useState, useRef, useEffect } from "react";
import styles from "./RepeatLayout.module.css";

interface Card {
  id: number;
  user_id: number;
  collection_id: number;
  question: string;
  answer: string;
  repetition_stage: number;
  next_repeat_time: Date;
}

interface RepeatLayoutProps {
  cards: Card[];
  collectionName: string;
  collectionId: number;
  onBack: () => void;
  onCardUpdated: () => void;
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

const RepeatLayout: React.FC<RepeatLayoutProps> = ({
  cards,
  collectionName,
  collectionId,
  onBack,
  onCardUpdated,
}) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [currentRepeatCards, setCurrentRepeatCards] = useState(cards.length);
  const [counterAnsweredCards, setCounterAnsweredCards] = useState(0);
  const [nextReplay, setNextReplay] = useState("");

  // const [isAnimating, setIsAnimating] = useState(false);
  //Обработчик сообщений Snackbar
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  // Текущая карточка
  const currentCard = cards[currentCardIndex];

  //Обработчик поворота карточки
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [showActionsForCard, setShowActionsForCard] = useState<number | null>(
    null
  );
  const [longPress, setlongPress] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [questionEdit, setQuestionEdit] = useState("");
  const [answerEdit, setAnswerEdit] = useState("");
  const [cardToEdit, setCardToEdit] = useState<Card | null>(null);
  const [showEditCardModal, setShowEditCardModal] = useState(false);

  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [checkYourSelf, setСheckYourSelf] = useState("");
  const [checkYourSelfRight, setSCheckYourSelfRight] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);


  // Проверка, все ли карточки пройдены
  const allCardsCompleted = currentCardIndex === cards.length;
  // Переход к следующей карточке
  const goToNextCard = () => {
    setCurrentRepeatCards(currentRepeatCards - 1);

    setCurrentCardIndex(currentCardIndex + 1);

    setСheckYourSelf("");
    setSCheckYourSelfRight(false);
  };

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

  // Обновляем имя коллекции при изменении извне
  useEffect(() => {
    //Обработчик получения следующего повторения
    const handleGetNextRepeat = async () => {
      try {
        const accessToken = getCookie("accessToken");
        const response = await fetch(
          `https://192.168.1.104:1026/repeat/${collectionId}/next-replay`,
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
              handleGetNextRepeat();
            }
          } else {
            throw new Error(
              `Ошибка ${response.status}: ${response.statusText}`
            );
          }
        } else {
          const data = await response.json();
          const localDate = new Date(data);

          setNextReplay(
            localDate.toLocaleString("ru-Ru", { timeZone: "Europe/Moscow" })
          );
        }
      } catch (error) {
        setSnackbarMessage(`Ошибка: ${(error as Error).message}`);
        setShowSnackbar(true);
        setTimeout(() => setShowSnackbar(false), 3000);
      }
    };

    // Если открыт не осталось карточек для повторений
    handleGetNextRepeat();
  }, [allCardsCompleted, collectionId]);

  // Обработка ответа "Помню"
  const handleRemember = async () => {
    try {
      const accessToken = getCookie("accessToken");
      const response = await fetch(
        `https://192.168.1.104:1026/repeat/know/${currentCard.id}`,
        {
          method: "POST",
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
            handleRemember();
          }
        } else {
          throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
        }
      }
    } catch (err) {
      setSnackbarMessage(`Ошибка: ${(err as Error).message}`);
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 3000);
    } finally {
      setTimeout(goToNextCard, 300);
      setCounterAnsweredCards(counterAnsweredCards+1)
    }
  };

  // Обработка ответа "Не помню"
  const handleForget = async () => {
    try {
      const accessToken = getCookie("accessToken");
      const response = await fetch(
        `https://192.168.1.104:1026/repeat/dont-know/${currentCard.id}`,
        {
          method: "POST",
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
            handleForget();
          }
        } else {
          throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
        }
      }
    } catch (err) {
      setSnackbarMessage(`Ошибка: ${(err as Error).message}`);
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 3000);
    } finally {
      setTimeout(goToNextCard, 300);
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
  // Обработчик долгого нажатия
  const handleLongPressStart = (cardId: number) => {
    if(showAnswer){
    longPressTimer.current = setTimeout(() => {
      setShowActionsForCard(cardId);
      setlongPress(true);
    }, 500); // 500ms для долгого нажатия
  }
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
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

  //Обработчик редактирования карточки
  const handleSubmit = async (cardId: number) => {
    if (!questionEdit.trim() || !answerEdit.trim()) {
      setError("Вопрос и ответ не могут быть пустыми");
      return;
    }
    handleSubmitTry(cardId);
  };

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
        }, 2000);

        currentCard.answer = answerEdit;
        currentCard.question = questionEdit;
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
      }, 2000);
    }

    } catch (error) {
      setSnackbarMessage(`Ошибка: ${(error as Error).message}`);
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 3000);
    } finally {
      setTimeout(goToNextCard, 300);
    }
  };

  const handleCheckYourSelf = () => {
    const answer = currentCard.answer;
    const changeAnswer = checkYourSelf;
    const resultAnswer = answer
      .replace(/\[.*?\]/g, "")
      .toUpperCase()
      .replace(new RegExp("[^\\p{L}]", "gu"), "");
    const resultChangeAnswer = changeAnswer
      .replace(/\[.*?\]/g, "")
      .toUpperCase()
      .replace(new RegExp("[^\\p{L}]", "gu"), "");

    if (resultAnswer === resultChangeAnswer) {
      setSCheckYourSelfRight(true);
    } else {
      setSCheckYourSelfRight(false);
    }
  };
  const handelOnonBack = () => {
    onCardUpdated();
    onBack();
  };

  return (
    <div className={styles.repeatLayoutContainer}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={handelOnonBack}>
          &larr; Назад
        </button>
        {cards.length === 0 || allCardsCompleted ? (
          <h1 className={styles.title}>
            <p>Нет карточек для повторения</p>
          </h1>
        ) : (
          <h1 className={styles.title}>
             <p>Осталось ответить: {currentRepeatCards}</p>
             <p>Уже ответили: {counterAnsweredCards}</p>
          </h1>
        )}
      </div>

      {cards.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Следующее повторение: {nextReplay}</p>
          <button className={styles.emptyButton} onClick={handelOnonBack}>
            Вернуться к коллекции
          </button>
        </div>
      ) : allCardsCompleted ? (
        <div className={styles.completedContainer}>
          <h2>Повторение завершено!</h2>
          <p>Вы ответили на все карточки из коллекции "{collectionName}"</p>
          <p>Следующее повторение:{nextReplay}</p>
          <button className={styles.completedButton} onClick={handelOnonBack}>
            Вернуться к коллекции
          </button>
        </div>
      ) : (
        <div className={styles.cardsContainer}>
          <div
            className={`${styles.card} ${
              flippedCards.includes(currentCard.id) ? styles.flipped : ""
            }`}
            onClick={() => handleCardFlip(currentCard.id)}
            onMouseDown={() => handleLongPressStart(currentCard.id)}
            onMouseUp={handleLongPressEnd}
            onMouseLeave={handleLongPressEnd}
            onTouchStart={() => handleLongPressStart(currentCard.id)}
            onTouchEnd={handleLongPressEnd}
          >
            <div className={styles.cardFront}>
              <div className={styles.cardContent}>
                <p>{currentCard.question}</p>
              </div>
            </div>
            <div className={styles.cardBack}>
              <div className={styles.cardContent}>
                <p>{currentCard.answer}</p>
              </div>
            </div>

            {showActionsForCard === currentCard.id && (
              <div
                className={styles.cardActions}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className={styles.actionButton}
                  onClick={() => handleEditCard(currentCard)}
                >
                  ✏️
                </button>
                <button
                  className={`${styles.actionButton} ${styles.deleteAction}`}
                  onClick={() =>
                    handleDeleteCardWithConfirmation(currentCard.id)
                  }
                >
                  🗑️
                </button>
              </div>
            )}
          </div>

          <textarea            
            placeholder="Проверь себя..."
            spellCheck={false}
            value={checkYourSelf}
            onChange={(e) => setСheckYourSelf(e.target.value)}
            onKeyUpCapture={handleCheckYourSelf}
            className={`${styles.checkYourSelfText} ${
              checkYourSelfRight
                ? styles.checkYourSelfRight
                : styles.checkYourSelfWrong
            }`}
          />

          <div className={styles.buttonsContainer}>
            <button
              className={`${styles.responseButton} ${styles.rememberButton}`}
              onClick={handleRemember}
            >
              Помню
            </button>
            <button
              className={`${styles.responseButton} ${styles.forgetButton}`}
              onClick={handleForget}
            >
              Не помню
            </button>
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

export default RepeatLayout;
