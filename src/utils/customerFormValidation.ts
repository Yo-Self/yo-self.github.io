import type { CustomerData } from '../contexts/CustomerDataContext';

export type CustomerFormMode = 'delivery' | 'pickup' | 'contact';

export function resolveCustomerFormMode(options: {
  isDeliveryRoute: boolean;
  deliveryMode?: 'delivery' | 'retirada' | 'dine_in';
  tablePayment?: boolean;
}): CustomerFormMode | null {
  if (options.isDeliveryRoute && options.deliveryMode === 'delivery') return 'delivery';
  if (options.isDeliveryRoute && options.deliveryMode === 'retirada') return 'pickup';
  if (options.tablePayment) return 'contact';
  return null;
}

export function isCustomerFormComplete(
  mode: CustomerFormMode | null,
  data: Pick<CustomerData, 'name' | 'address' | 'number' | 'whatsapp'>,
  options?: { hasCoordinates?: boolean },
): boolean {
  if (!mode) return true;

  const hasName = !!data.name?.trim();
  const hasPhone = !!data.whatsapp?.trim();

  if (mode === 'pickup' || mode === 'contact') {
    return hasName && hasPhone;
  }

  const hasAddress = !!data.address?.trim();
  const hasNumber = !!data.number?.trim();
  const hasCoordinates = options?.hasCoordinates ?? false;

  return hasName && hasPhone && hasAddress && hasNumber && hasCoordinates;
}

export type CustomerFormValidationField =
  | 'customer_name'
  | 'customer_phone'
  | 'customer_address'
  | 'customer_number'
  | 'delivery_coordinates';

export function getCustomerFormValidationError(
  mode: CustomerFormMode | null,
  data: Pick<CustomerData, 'name' | 'address' | 'number' | 'whatsapp'>,
  options?: { hasCoordinates?: boolean },
): { field: CustomerFormValidationField; message: string } | null {
  if (!mode) return null;

  if (!data.name?.trim()) {
    return {
      field: 'customer_name',
      message: 'Por favor, informe seu Nome antes de continuar.',
    };
  }

  if (!data.whatsapp?.trim()) {
    return {
      field: 'customer_phone',
      message: 'Por favor, informe seu Telefone antes de continuar.',
    };
  }

  if (mode === 'delivery') {
    if (!data.address?.trim()) {
      return {
        field: 'customer_address',
        message: 'Por favor, informe seu Endereço antes de continuar.',
      };
    }

    if (!options?.hasCoordinates) {
      return {
        field: 'delivery_coordinates',
        message: 'Selecione seu endereço na lista de sugestões para confirmar a entrega.',
      };
    }

    if (!data.number?.trim()) {
      return {
        field: 'customer_number',
        message: 'Por favor, informe o Número do endereço antes de continuar.',
      };
    }
  }

  return null;
}
