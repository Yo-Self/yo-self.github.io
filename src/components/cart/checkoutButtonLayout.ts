/**
 * Shared layout for CartModal checkout actions (WhatsApp, PIX, card, wallet).
 * min-h fits two-line mobile labels; sm min-h fits desktop subtitle row.
 */
export const checkoutActionButtonMinHeightClass =
  'min-h-[3.75rem] sm:min-h-[4.25rem] h-full';

/** Wrapper in flex/grid cells so the child button stretches to row height. */
export const checkoutActionButtonCellClass = 'flex-1 min-w-0 flex';

export const checkoutActionButtonPaddingClass = 'px-2 sm:px-4 py-3.5 sm:py-4';

export const checkoutActionIconClass = 'h-5 w-5 shrink-0 sm:h-6 sm:w-6';

export const checkoutActionContentClass =
  'inline-flex w-fit max-w-full shrink-0 items-center justify-center gap-1.5 sm:gap-2';

export const checkoutActionTextColumnClass =
  'flex min-w-0 flex-col items-center justify-center text-center';

export const checkoutActionLabelClass =
  'text-xs font-bold leading-[1.15] whitespace-normal sm:text-sm';

/** Two-line mobile label (e.g. Pedir pelo WhatsApp) without stretching the row. */
export const checkoutActionLabelWrapMobileClass = 'max-w-[4.5rem] sm:max-w-none';

export const checkoutActionSubtitleClass =
  'hidden max-w-full truncate text-[10px] opacity-90 sm:block sm:text-xs';

/**
 * Stripe Express CheckoutElement buttonHeight (px).
 * Stripe only allows 40–55; other checkout buttons use ~60px min-height via CSS.
 */
export const checkoutExpressWalletButtonHeightPx = 55;
