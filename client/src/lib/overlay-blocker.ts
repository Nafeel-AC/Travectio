// Runtime overlay blocker - directly hides the Vite error overlay
let overlayBlockerInstalled = false;

export function installOverlayBlocker() {
  if (overlayBlockerInstalled) return;
  
  
  // Function to hide any runtime overlay that appears
  const hideOverlay = () => {
    // Look for Vite error overlay elements
    const overlays = [
      'vite-error-overlay',
      '[data-vite-error-overlay]',
      '.vite-error-overlay',
      '#vite-error-overlay'
    ];
    
    overlays.forEach(selector => {
      const overlay = document.querySelector(selector);
      if (overlay) {
        (overlay as HTMLElement).style.display = 'none';
        (overlay as HTMLElement).remove();
      }
    });
    
    // Also look for any element with error overlay styling
    const errorElements = document.querySelectorAll('[style*="position: fixed"], [style*="z-index"]');
    errorElements.forEach(element => {
      const htmlElement = element as HTMLElement;
      if (htmlElement.textContent?.includes('Failed to fetch') || 
          htmlElement.textContent?.includes('runtime-error-plugin')) {
        htmlElement.style.display = 'none';
        htmlElement.remove();
      }
    });
  };
  
  // Check for overlays periodically
  setInterval(hideOverlay, 100);
  
  // Also check when DOM changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (element.tagName === 'VITE-ERROR-OVERLAY' || 
                element.getAttribute?.('data-vite-error-overlay') !== null ||
                element.textContent?.includes('Failed to fetch')) {
              element.remove();
            }
          }
        });
      }
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Hide any existing overlays immediately
  hideOverlay();
  
  overlayBlockerInstalled = true;
}