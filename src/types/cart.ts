import { MenuItem } from './restaurant';
import { Dish } from '../components/data';

/**
 * Representa um item individual no carrinho de compras
 */
export interface CartItem {
  /** Identificador único do item no carrinho (gerado automaticamente) */
  id: string;
  
  /** Dados do prato/item do menu */
  dish: MenuItem;
  
  /** Complementos selecionados organizados por grupo */
  selectedComplements: Map<string, Set<string>>;
  
  /** Quantidade deste item no carrinho */
  quantity: number;
  
  /** Preço unitário calculado (preço base + complementos) */
  unitPrice: number;
  
  /** Preço total do item (unitPrice * quantity) */
  totalPrice: number;
}

/**
 * Interface do contexto do carrinho de compras
 */
export interface CartContextType {
  /** Lista de itens no carrinho */
  items: CartItem[];
  
  /** Número total de itens no carrinho */
  totalItems: number;
  
  /** Preço total de todos os itens */
  totalPrice: number;
  
  /** Adiciona um novo item ao carrinho */
  addItem: (dish: MenuItem, selectedComplements: Map<string, Set<string>>) => void;
  
  /** Remove um item específico do carrinho */
  removeItem: (itemId: string) => void;
  
  /** Atualiza a quantidade de um item específico */
  updateQuantity: (itemId: string, quantity: number) => void;
  
  /** Remove todos os itens do carrinho */
  clearCart: () => void;
  
  /** Estado de abertura do modal do carrinho */
  isCartOpen: boolean;
  
  /** Abre o modal do carrinho */
  openCart: () => void;
  
  /** Fecha o modal do carrinho */
  closeCart: () => void;
}

/**
 * Dados serializáveis para armazenamento no localStorage
 */
export interface SerializableCartItem {
  id: string;
  dish: MenuItem;
  selectedComplements: [string, string[]][]; // Formato serializable do Map
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

/**
 * Estrutura do carrinho para persistência
 */
export interface SerializableCart {
  items: SerializableCartItem[];
  timestamp: number;
}

/**
 * Funções utilitárias para conversão entre formatos
 */
export class CartUtils {
  /**
   * Converte Map<string, Set<string>> para formato serializável
   */
  static mapToSerializable(complementsMap: Map<string, Set<string>>): [string, string[]][] {
    return Array.from(complementsMap.entries()).map(([key, value]) => [key, Array.from(value)]);
  }

  /**
   * Converte formato serializável para Map<string, Set<string>>
   */
  static serializableToMap(serializable: [string, string[]][]): Map<string, Set<string>> {
    // Verificação de segurança para evitar erros
    if (!serializable || !Array.isArray(serializable)) {
      return new Map();
    }
    return new Map(serializable.map(([key, value]) => [key, new Set(value || [])]));
  }

  /**
   * Converte CartItem para formato serializável
   */
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

  /**
   * Converte formato serializável para CartItem
   */
  static serializableToItem(serializable: SerializableCartItem): CartItem {
    // Verificação de segurança para evitar erros
    if (!serializable) {
      throw new Error('SerializableCartItem é undefined ou null');
    }
    
    if (!serializable.dish) {
      throw new Error('Dish é undefined ou null no SerializableCartItem');
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

  /**
   * Calcula o preço unitário de um item incluindo complementos
   */
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

  /**
   * Gera um ID único para um item do carrinho
   */
  static generateItemId(dish: MenuItem, selectedComplements: Map<string, Set<string>>): string {
    const complementsString = Array.from(selectedComplements.entries())
      .map(([group, items]) => `${group}:${Array.from(items).sort().join(',')}`)
      .sort()
      .join('|');
    
    return `${dish.name}-${complementsString}`.replace(/[^a-zA-Z0-9-_]/g, '_');
  }

  /**
   * Verifica se dois itens são idênticos (mesmo prato e complementos)
   */
  static areItemsIdentical(
    dish1: MenuItem, 
    complements1: Map<string, Set<string>>,
    dish2: MenuItem,
    complements2: Map<string, Set<string>>
  ): boolean {
    if (dish1.name !== dish2.name) return false;
    
    // Verificar se têm o mesmo número de grupos de complementos
    if (complements1.size !== complements2.size) return false;
    
    // Verificar cada grupo
    for (const [group, items1] of complements1.entries()) {
      const items2 = complements2.get(group);
      if (!items2) return false;
      
      if (items1.size !== items2.size) return false;
      
      for (const item of items1) {
        if (!items2.has(item)) return false;
      }
    }
    
    return true;
  }

  /**
   * Formata preço para exibição em formato brasileiro
   */
  static formatPrice(price: number): string {
    return price.toFixed(2).replace('.', ',');
  }

  /**
   * Verifica se um prato tem complementos obrigatórios com preço maior que zero
   */
  static hasRequiredComplementsWithPrice(dish: MenuItem | Dish): boolean {
    if (!dish.complement_groups || dish.complement_groups.length === 0) {
      return false;
    }

    return dish.complement_groups.some(group => {
      // Verifica se o grupo é obrigatório
      if (!group.required) {
        return false;
      }

      // Verifica se há pelo menos um complemento com preço maior que 0
      return group.complements.some(complement => {
        const price = parseFloat(complement.price.replace(',', '.'));
        return price > 0;
      });
    });
  }
}
