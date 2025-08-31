/**
 * Utility functions for managing customer mode state
 */

export function getCustomerModeState(): { isCustomerMode: boolean; devUserParam: string } {
  // Check localStorage first (persistent across sessions)
  const storedMode = localStorage.getItem('travectio_view_mode');
  
  // Check URL parameter as backup
  const urlParams = new URLSearchParams(window.location.search);
  const urlDevUser = urlParams.get('dev_user');
  
  const isCustomerMode = storedMode === 'customer' || urlDevUser === 'customer';
  
  return {
    isCustomerMode,
    devUserParam: isCustomerMode ? 'customer' : ''
  };
}

export function addCustomerModeToUrl(url: string): string {
  const { isCustomerMode } = getCustomerModeState();
  
  if (!isCustomerMode) {
    return url;
  }
  
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}dev_user=customer`;
}

export function setCustomerMode(mode: 'founder' | 'customer'): void {
  if (mode === 'customer') {
    localStorage.setItem('travectio_view_mode', 'customer');
  } else {
    localStorage.removeItem('travectio_view_mode');
  }
}