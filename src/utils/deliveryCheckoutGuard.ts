import { Coordinates } from './distanceCalculator';
import { DeliveryCalculationResult } from './deliveryCalculator';

export function mapDeliveryReasonToError(calc: DeliveryCalculationResult): Error {
  switch (calc.reason) {
    case 'missing_coordinates':
    case 'waiting_location':
      return new Error('Selecione seu endereço no mapa para calcular a entrega.');
    case 'exclusion_zone':
      return new Error(
        calc.zoneName
          ? `Endereço indisponível para entrega na região: ${calc.zoneName}`
          : 'Endereço indisponível para entrega nesta região.',
      );
    case 'distance_exceeded':
      return new Error('Endereço fora da área de entrega do restaurante.');
    case 'delivery_disabled':
      return new Error('Este restaurante não está aceitando entregas no momento.');
    default:
      return new Error('Endereço fora da área de entrega.');
  }
}

export function assertDeliveryReadyForCheckout(params: {
  isDelivery: boolean;
  coordinates: Coordinates | null | undefined;
  deliveryCalc: DeliveryCalculationResult;
}): void {
  if (!params.isDelivery) return;

  if (!params.coordinates) {
    throw new Error('Selecione seu endereço no mapa para calcular a entrega.');
  }

  if (!params.deliveryCalc.covered) {
    throw mapDeliveryReasonToError(params.deliveryCalc);
  }
}
