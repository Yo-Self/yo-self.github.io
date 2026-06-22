import { MenuItem } from './restaurant';
import { buildPrefaceAnswersPayload } from './complementPreface';

export interface CartItem {
  id: string;
  dish: MenuItem;
  selectedComplements: Map<string, Set<string>>;
  prefaceAnswers: Map<string, string>;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface RestaurantCart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

export interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (
    dish: MenuItem,
    selectedComplements: Map<string, Set<string>>,
    prefaceAnswers?: Map<string, string>
  ) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  setCurrentRestaurant: (restaurantId: string) => void;
  cartRestaurantId: string | null;
}

export interface SerializableCartItem {
  id: string;
  dish: MenuItem;
  selectedComplements: [string, string[]][];
  prefaceAnswers: [string, string][];
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface SerializableRestaurantCart {
  items: SerializableCartItem[];
}

export interface SerializableCarts {
  [restaurantId: string]: SerializableRestaurantCart;
}

export class CartUtils {
  static mapToSerializable(complementsMap: Map<string, Set<string>>): [string, string[]][] {
    return Array.from(complementsMap.entries()).map(([key, value]) => [key, Array.from(value)]);
  }

  static answersToSerializable(answersMap: Map<string, string>): [string, string][] {
    return Array.from(answersMap.entries());
  }

  static serializableToMap(serializable: [string, string[]][]): Map<string, Set<string>> {
    if (!serializable || !Array.isArray(serializable)) {
      return new Map();
    }
    return new Map(serializable.map(([key, value]) => [key, new Set(value || [])]));
  }

  static serializableToAnswers(serializable?: [string, string][]): Map<string, string> {
    if (!serializable || !Array.isArray(serializable)) {
      return new Map();
    }
    return new Map(serializable);
  }

  static itemToSerializable(item: CartItem): SerializableCartItem {
    return {
      id: item.id,
      dish: item.dish,
      selectedComplements: CartUtils.mapToSerializable(item.selectedComplements),
      prefaceAnswers: CartUtils.answersToSerializable(item.prefaceAnswers || new Map()),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    };
  }

  static serializableToItem(serializable: SerializableCartItem): CartItem {
    if (!serializable || !serializable.dish) {
      throw new Error('Invalid serializable item');
    }
    return {
      id: serializable.id || '',
      dish: serializable.dish,
      selectedComplements: CartUtils.serializableToMap(serializable.selectedComplements || []),
      prefaceAnswers: CartUtils.serializableToAnswers(serializable.prefaceAnswers),
      quantity: serializable.quantity || 1,
      unitPrice: serializable.unitPrice || 0,
      totalPrice: serializable.totalPrice || 0,
    };
  }

  static calculateUnitPrice(dish: MenuItem, selectedComplements: Map<string, Set<string>>): number {
    let total = parseFloat(dish.price.replace(',', '.'));
    selectedComplements.forEach((selections, groupTitle) => {
      const group = dish.complement_groups?.find(g => g.title === groupTitle);
      if (group) {
        selections.forEach(complementName => {
          const complement = group.complements.find(c => c.name === complementName);
          if (complement) {
            total += parseFloat(complement.price.replace(',', '.'));
          }
        });
      }
    });
    return total;
  }

  static generateItemId(
    dish: MenuItem,
    selectedComplements: Map<string, Set<string>>,
    prefaceAnswers: Map<string, string> = new Map()
  ): string {
    const complementsString = Array.from(selectedComplements.entries())
      .map(([group, items]) => `${group}:${Array.from(items).sort().join(',')}`)
      .sort()
      .join('|');
    const answersString = Array.from(prefaceAnswers.entries())
      .map(([group, answerId]) => `${group}:${answerId}`)
      .sort()
      .join('|');
    return `${dish.name}-${complementsString}-${answersString}`.replace(/[^a-zA-Z0-9-_]/g, '_');
  }

  static areItemsIdentical(
    dish1: MenuItem, 
    complements1: Map<string, Set<string>>,
    dish2: MenuItem,
    complements2: Map<string, Set<string>>,
    prefaceAnswers1: Map<string, string> = new Map(),
    prefaceAnswers2: Map<string, string> = new Map()
  ): boolean {
    if (dish1.name !== dish2.name) return false;
    if (complements1.size !== complements2.size) return false;
    if (prefaceAnswers1.size !== prefaceAnswers2.size) return false;
    for (const [group, items1] of complements1.entries()) {
      const items2 = complements2.get(group);
      if (!items2 || items1.size !== items2.size) return false;
      for (const item of items1) {
        if (!items2.has(item)) return false;
      }
    }
    for (const [group, answer1] of prefaceAnswers1.entries()) {
      if (prefaceAnswers2.get(group) !== answer1) return false;
    }
    return true;
  }

  static formatPrice(price: number): string {
    return price.toFixed(2).replace('.', ',');
  }

  static hasRequiredComplementsWithPrice(dish: MenuItem): boolean {
    if (!dish.complement_groups || dish.complement_groups.length === 0) {
      return false;
    }

    return dish.complement_groups.some(group => {
      if (!group.required) {
        return false;
      }

      return group.complements.some(complement => {
        const price = parseFloat(complement.price.replace(',', '.'));
        return price > 0;
      });
    });
  }

  static mapItemToOrderPayload(item: CartItem) {
    const complementGroupAnswers = buildPrefaceAnswersPayload(
      item.dish.complement_groups || [],
      item.prefaceAnswers || new Map()
    );

    return {
      dish_id: item.dish.id,
      quantity: item.quantity,
      price_at_time_of_order: Math.round(parseFloat(item.dish.price.replace(',', '.')) * 100),
      selected_complements: Array.from(item.selectedComplements.entries()).flatMap(([groupTitle, selections]) =>
        Array.from(selections).map(complementName => {
          const group = item.dish.complement_groups?.find(g => g.title === groupTitle);
          const complement = group?.complements.find(c => c.name === complementName);
          return {
            complement_id: complement?.id || 'unknown',
            name: complementName,
            price: Math.round(parseFloat(complement?.price.replace(',', '.') || '0') * 100),
          };
        })
      ),
      complement_group_answers: complementGroupAnswers.length > 0 ? complementGroupAnswers : undefined,
      sent_to_kitchen: item.dish.needs_preparation !== false,
    };
  }
}
