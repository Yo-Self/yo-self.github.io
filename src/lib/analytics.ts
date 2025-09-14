'use client'

import posthog from 'posthog-js'

// Analytics utility for tracking custom events throughout the app
export class Analytics {
  private static isInitialized(): boolean {
    return typeof window !== 'undefined' && 
           !!process.env.NEXT_PUBLIC_POSTHOG_KEY && 
           posthog.__loaded
  }

  private static track(event: string, properties?: Record<string, any>): void {
    if (!this.isInitialized()) {
      console.log(`[Analytics] Would track: ${event}`, properties)
      return
    }

    try {
      posthog.capture(event, {
        ...properties,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        page_url: window.location.href,
        page_path: window.location.pathname
      })
    } catch (error) {
      console.warn('[Analytics] Failed to track event:', event, error)
    }
  }

  // Cart Analytics
  static trackCartItemAdded(dish: any, selectedComplements: any, quantity: number, restaurantId: string): void {
    this.track('cart_item_added', {
      dish_name: dish.name,
      dish_price: dish.price,
      dish_category: dish.category,
      quantity,
      complement_count: selectedComplements?.size || 0,
      restaurant_id: restaurantId,
      has_complements: (selectedComplements?.size || 0) > 0
    })
  }

  static trackCartItemRemoved(item: any, restaurantId: string): void {
    this.track('cart_item_removed', {
      dish_name: item.dish.name,
      dish_price: item.dish.price,
      quantity: item.quantity,
      total_price: item.totalPrice,
      restaurant_id: restaurantId
    })
  }

  static trackCartQuantityChanged(item: any, oldQuantity: number, newQuantity: number, restaurantId: string): void {
    this.track('cart_quantity_changed', {
      dish_name: item.dish.name,
      old_quantity: oldQuantity,
      new_quantity: newQuantity,
      change: newQuantity - oldQuantity,
      restaurant_id: restaurantId
    })
  }

  static trackCartCleared(itemCount: number, totalValue: number, restaurantId: string): void {
    this.track('cart_cleared', {
      item_count: itemCount,
      total_value: totalValue,
      restaurant_id: restaurantId
    })
  }

  static trackCartOpened(itemCount: number, totalValue: number, restaurantId: string): void {
    this.track('cart_opened', {
      item_count: itemCount,
      total_value: totalValue,
      restaurant_id: restaurantId,
      has_items: itemCount > 0
    })
  }

  static trackCartCheckout(items: any[], totalValue: number, restaurantId: string, method: string): void {
    this.track('cart_checkout_started', {
      item_count: items.length,
      total_items: items.reduce((sum, item) => sum + item.quantity, 0),
      total_value: totalValue,
      restaurant_id: restaurantId,
      checkout_method: method,
      unique_dishes: items.length
    })
  }

  // Chatbot Analytics
  static trackChatbotOpened(restaurantId: string, type: 'standard' | 'integrated'): void {
    this.track('chatbot_opened', {
      restaurant_id: restaurantId,
      chatbot_type: type
    })
  }

  static trackChatbotClosed(restaurantId: string, sessionLength: number, messageCount: number): void {
    this.track('chatbot_closed', {
      restaurant_id: restaurantId,
      session_length_seconds: sessionLength,
      message_count: messageCount
    })
  }

  static trackChatMessage(restaurantId: string, messageType: 'user' | 'assistant', hasRecommendations: boolean): void {
    this.track('chat_message_sent', {
      restaurant_id: restaurantId,
      message_type: messageType,
      has_recommendations: hasRecommendations
    })
  }

  static trackChatDishRecommendation(dishName: string, restaurantId: string, source: 'llm' | 'search'): void {
    this.track('chat_dish_recommended', {
      dish_name: dishName,
      restaurant_id: restaurantId,
      recommendation_source: source
    })
  }

  static trackChatDishCardClicked(dishName: string, restaurantId: string, position: number): void {
    this.track('chat_dish_card_clicked', {
      dish_name: dishName,
      restaurant_id: restaurantId,
      card_position: position
    })
  }

  static trackChatVoiceToggle(enabled: boolean, restaurantId: string): void {
    this.track('chat_voice_toggled', {
      enabled,
      restaurant_id: restaurantId
    })
  }

  static trackChatVoiceMessage(messageLength: number, restaurantId: string): void {
    this.track('chat_voice_message_played', {
      message_length_chars: messageLength,
      restaurant_id: restaurantId
    })
  }

  // Menu Browsing Analytics
  static trackDishViewed(dish: any, restaurantId: string, source: string): void {
    this.track('dish_viewed', {
      dish_name: dish.name,
      dish_price: dish.price,
      dish_category: dish.category,
      restaurant_id: restaurantId,
      view_source: source,
      has_complements: dish.complement_groups?.length > 0
    })
  }

  static trackMenuSearch(params: { query: string; resultCount?: number; restaurantId: string }): void {
    this.track('menu_searched', {
      search_query: params.query,
      result_count: params.resultCount || 0,
      query_length: params.query.length,
      restaurant_id: params.restaurantId
    })
  }

  static trackMenuSearchCleared(params: { restaurantId: string }): void {
    this.track('menu_search_cleared', {
      restaurant_id: params.restaurantId
    })
  }

  static trackCategorySelected(params: { category: string; restaurantId: string }): void {
    this.track('menu_category_selected', {
      category: params.category,
      restaurant_id: params.restaurantId
    })
  }

  static trackImageZoomed(imageSrc: string, dishName: string, restaurantId: string): void {
    this.track('image_zoomed', {
      dish_name: dishName,
      image_src: imageSrc,
      restaurant_id: restaurantId
    })
  }

  static trackDishModalOpened(dish: any, restaurantId: string, source: string): void {
    this.track('dish_modal_opened', {
      dish_name: dish.name,
      dish_price: dish.price,
      dish_category: dish.category,
      restaurant_id: restaurantId,
      opened_from: source,
      has_complements: dish.complement_groups?.length > 0
    })
  }

  static trackDishModalClosed(dish: any, restaurantId: string, timeSpent: number): void {
    this.track('dish_modal_closed', {
      dish_name: dish.name,
      restaurant_id: restaurantId,
      time_spent_seconds: timeSpent
    })
  }

  // Restaurant Service Analytics
  static trackWaiterCalled(tableNumber: number, hasNotes: boolean, restaurantId: string): void {
    this.track('waiter_called', {
      table_number: tableNumber,
      has_notes: hasNotes,
      restaurant_id: restaurantId
    })
  }

  static trackWaiterCallAttended(callId: string, responseTime: number, restaurantId: string): void {
    this.track('waiter_call_attended', {
      call_id: callId,
      response_time_minutes: responseTime,
      restaurant_id: restaurantId
    })
  }

  static trackAccessibilityToggle(feature: string, enabled: boolean, restaurantId: string): void {
    this.track('accessibility_feature_toggled', {
      feature,
      enabled,
      restaurant_id: restaurantId
    })
  }

  static trackVoiceFeatureUsed(feature: string, restaurantId: string): void {
    this.track('voice_feature_used', {
      feature,
      restaurant_id: restaurantId
    })
  }

  static trackRestaurantSwitched(fromRestaurantId: string, toRestaurantId: string): void {
    this.track('restaurant_switched', {
      from_restaurant_id: fromRestaurantId,
      to_restaurant_id: toRestaurantId
    })
  }

  // App Lifecycle Analytics
  static trackAppInstallPromptShown(restaurantId: string): void {
    this.track('app_install_prompt_shown', {
      restaurant_id: restaurantId
    })
  }

  static trackAppInstallPromptClicked(action: 'install' | 'dismiss', restaurantId: string): void {
    this.track('app_install_prompt_clicked', {
      action,
      restaurant_id: restaurantId
    })
  }

  static trackPWALaunched(restaurantId: string): void {
    this.track('pwa_launched', {
      restaurant_id: restaurantId,
      is_standalone: window.matchMedia('(display-mode: standalone)').matches
    })
  }

  static trackPageViewed(path: string, restaurantId: string): void {
    this.track('page_viewed', {
      page_path: path,
      restaurant_id: restaurantId,
      is_pwa: window.matchMedia('(display-mode: standalone)').matches
    })
  }

  static trackPageView(path: string, restaurantId: string): void {
    this.trackPageViewed(path, restaurantId);
  }

  static trackSessionStarted(restaurantId: string): void {
    this.track('session_started', {
      restaurant_id: restaurantId,
      device_type: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      is_pwa: window.matchMedia('(display-mode: standalone)').matches
    })
  }

  static trackSessionStart(restaurantId: string): void {
    this.trackSessionStarted(restaurantId);
  }

  static trackSessionEnd(restaurantId: string): void {
    this.track('session_ended', {
      restaurant_id: restaurantId,
      timestamp: new Date().toISOString()
    })
  }

  // Performance Analytics
  static trackPerformanceMetric(metric: string, value: number, context?: Record<string, any>): void {
    this.track('performance_metric', {
      metric_name: metric,
      metric_value: value,
      ...context
    })
  }

  static trackError(error: Error, context?: Record<string, any>): void {
    this.track('app_error', {
      error_message: error.message,
      error_stack: error.stack,
      ...context
    })
  }

  // Feature Usage Analytics
  static trackFeatureUsed(feature: string, context?: Record<string, any>): void {
    this.track('feature_used', {
      feature_name: feature,
      ...context
    })
  }

  // Engagement Analytics
  static trackUserEngagement(action: string, context?: Record<string, any>): void {
    this.track('user_engagement', {
      engagement_action: action,
      ...context
    })
  }
}

// Helper function to get current restaurant ID from URL or context
export function getCurrentRestaurantId(): string | undefined {
  if (typeof window === 'undefined') return undefined
  
  const path = window.location.pathname
  const match = path.match(/\/restaurant\/([^\/]+)/)
  return match ? match[1] : undefined
}

// Export default for convenience
export default Analytics