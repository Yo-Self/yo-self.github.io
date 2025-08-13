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
  categories?: string[];
  complement_groups?: ComplementGroup[];
};

export type MenuItem = Omit<Dish, 'category'> & { 
  category: string;
  categories: string[];
};

export type Restaurant = {
  id: string;
  name: string;
  welcome_message: string;
  image: string;
  slug?: string;
  menu_categories: string[];
  featured_dishes: Dish[];
  menu_items: MenuItem[];
};