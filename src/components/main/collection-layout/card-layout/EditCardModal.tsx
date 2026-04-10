import React, { useState } from 'react';
import styles from './CardsLayout.module.css';

interface Card {
  id: number;
  collection_id: number;
  question: string;
  answer: string;
}

interface EditCardModalProps {
  card: Card;
  collectionId: number;
  onClose: () => void;
  onCardUpdated: () => void;
}

const EditCardModal: React.FC<EditCardModalProps> = ({ 
  card, 
  collectionId,
  onClose,
  onCardUpdated
}) => {
  const [question, setQuestion] = useState(card.question);
  const [answer, setAnswer] = useState(card.answer);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!question.trim() || !answer.trim()) {
      setError('Вопрос и ответ не могут быть пустыми');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      
      const response = await fetch(`http://localhost:1026/cards/${collectionId}/${card.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          answer
        }),
      });

      if (!response.ok) {
        throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
      }

      onCardUpdated();
      onClose();
    } catch (err) {
      setError(`Ошибка: ${(err as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2 className={styles.modalTitle}>Редактор карточки</h2>
        
        {error && <div className={styles.errorText}>{error}</div>}
        
        <div className={styles.formGroup}>
          <label htmlFor="editQuestion">Вопрос:</label>
          <textarea
            id="editQuestion"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className={styles.inputField}
            rows={3}
            placeholder="Введите вопрос"
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="editAnswer">Ответ:</label>
          <textarea
            id="editAnswer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className={styles.inputField}
            rows={3}
            placeholder="Введите ответ"
          />
        </div>
        
        <div className={styles.modalButtons}>
          <button 
            className={`${styles.modalButton} ${styles.cancelButton}`}
            onClick={onClose}
            disabled={isSubmitting}
          >
            Отмена
          </button>
          <button 
            className={`${styles.modalButton} ${styles.submitButton}`}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Сохранение...' : 'Редактировать'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditCardModal;