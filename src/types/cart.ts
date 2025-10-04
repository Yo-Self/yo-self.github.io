import { MenuItem } from './restaurant';

export interface CartItem {
  id: string;
  dish: MenuItem;
  selectedComplements: Map<string, Set<string>>;
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
  addItem: (dish: MenuItem, selectedComplements: Map<string, Set<string>>) => void;
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

  static serializableToMap(serializable: [string, string[]][]): Map<string, Set<string>> {
    if (!serializable || !Array.isArray(serializable)) {
      return new Map();
    }
    return new Map(serializable.map(([key, value]) => [key, new Set(value || [])]));
  }

  static itemToSerializable(item: CartItem): SerializableCartItem {
    return {
      id: item.id,
      dish: item.dish,
      selectedComplements: this.mapToSerializable(item.selectedComplements),
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
      selectedComplements: this.serializableToMap(serializable.selectedComplements || []),
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

  static generateItemId(dish: MenuItem, selectedComplements: Map<string, Set<string>>): string {
    const complementsString = Array.from(selectedComplements.entries())
      .map(([group, items]) => `${group}:${Array.from(items).sort().join(',')}`)
      .sort()
      .join('|');
    return `${dish.name}-${complementsString}`.replace(/[^a-zA-Z0-9-_]/g, '_');
  }

  static areItemsIdentical(
    dish1: MenuItem, 
    complements1: Map<string, Set<string>>,
    dish2: MenuItem,
    complements2: Map<string, Set<string>>
  ): boolean {
    if (dish1.name !== dish2.name) return false;
    if (complements1.size !== complements2.size) return false;
    for (const [group, items1] of complements1.entries()) {
      const items2 = complements2.get(group);
      if (!items2 || items1.size !== items2.size) return false;
      for (const item of items1) {
        if (!items2.has(item)) return false;
      }
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
}