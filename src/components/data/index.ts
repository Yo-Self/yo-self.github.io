export type Complement = {
  name: string;
  description: string;
  price: string;
  image: string;
  ingredients?: string;
  allergens?: string;
  portion?: string;
};

export type ComplementGroup = {
  title: string;
  description?: string;
  required?: boolean;
  max_selections?: number;
  complements: Complement[];
};

export type Dish = {
  name: string;
  description: string;
  price: string;
  image: string;
  tags?: string[];
  ingredients: string;
  allergens: string;
  portion: string;
  category?: string;
  complement_groups?: ComplementGroup[];
};

export type MenuItem = Omit<Dish, 'category'> & { category: string };

export type Restaurant = {
  id: string;
  name: string;
  welcome_message: string;
  image: string;
  menu_categories: string[];
  featured_dishes: Dish[];
  menu_items: MenuItem[];
};

import korean from './korean.json';
import japanese from './japanese.json';
import chinese from './chinese.json';
import moendo from './moendo.json';

export const restaurants: Restaurant[] = [
  korean,
  japanese,
  chinese,
  moendo
];

export const restaurantMap = Object.fromEntries(restaurants.map(r => [ r.id, r ])); 