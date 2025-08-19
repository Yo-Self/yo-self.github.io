import React from 'react';
import { Dish, MenuItem } from './data';
import CardJornal from './CardJornal';

interface ChatDishCardsProps {
  dishes: (Dish | MenuItem)[];
  onDishClick: (dish: Dish | MenuItem) => void;
}

import AnimatedChatDishCards from "./AnimatedChatDishCards";

export default function ChatDishCards({ dishes, onDishClick }: ChatDishCardsProps) {
  return <AnimatedChatDishCards dishes={dishes} onDishClick={onDishClick} />;
}
