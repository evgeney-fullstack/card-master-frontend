import React, { useState } from "react";
import styles from "./Property.module.css";


interface Card {
  id: number;
  user_id: number;
  collection_id: number;
  question: string;
  answer: string;
  repetition_stage: number;
  next_repeat_time: Date;
}

interface PropertyCardProps {
  card: Card;
  collectionId:number;
  showEditCardModal:boolean;
  onHandleEditCard: (card: Card) => void;
  onShowActionsForCard:(value: React.SetStateAction<number | null>) => void;
  onShowEditCardModal:React.Dispatch<React.SetStateAction<boolean>>

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

const PropertyCard: React.FC<PropertyCardProps> = ({
  card,
  collectionId,
  showEditCardModal,
  onHandleEditCard,
  onShowActionsForCard,
  onShowEditCardModal,
}) => {
 // const [showOptions, setShowOptions] = useState(false);
 // const [isEditing, setIsEditing] = useState(false);
 // const [newName, setNewName] = useState(collectionName);

  const [cardToEdit, setCardToEdit] = useState<Card | null>(null);
  

 


    // Обработчик открытия редактора карточки
  const handleEditCard = (card: Card) => {
    console.log(card)
    setCardToEdit(card);
    onShowEditCardModal(true);
    onShowActionsForCard(null);
  };


  // Обработчик успешного обновления карточки
  const handleCardUpdated = () => {
    // setSnackbar({ show: true, message: 'Карточка отредактирована' });
    // setTimeout(() => setSnackbar({ show: false, message: '' }), 2000);
    // fetchCards();
  };

  

  return (
    <div className={styles.propertyContainer}>
      <div className={styles.cardActions} onClick={(e) => e.stopPropagation()}>
        <button
          className={styles.actionButton}
          onClick={() => onHandleEditCard(card)}
        >
          ✏️
        </button>

      </div>

            {/* Модальное окно редактирования карточки */}
      {/* {showEditCardModal && cardToEdit && (
        <EditCardModal
          card={cardToEdit}
          collectionId={collectionId}
          onClose={() => onShowEditCardModal(false)}       
          onCardUpdated={handleCardUpdated}   
        />
      )} */}

     {/* {showSnackbar && <div className={styles.snackbar}>{snackbarMessage}</div>} */}
    </div>
  );
};

export default PropertyCard;
