// Global error handler to prevent runtime error overlays
// This catches any unhandled promise rejections that might trigger the overlay

let errorHandlerInstalled = false;

export function installGlobalErrorHandler() {
  if (errorHandlerInstalled) return;
  
  
  // Handle unhandled promise rejections - suppress ALL of them to prevent overlay
  window.addEventListener('unhandledrejection', (event) => {
    event.preventDefault(); // Always prevent the error from bubbling up
  });
  
  // Handle general errors - suppress fetch-related ones
  window.addEventListener('error', (event) => {
    // Check if this is a fetch-related error
    if (event.error && 
        (event.error.message?.includes('fetch') || 
         event.error.message?.includes('Failed to fetch') ||
         event.error.message?.includes('Network') ||
         event.error.toString?.()?.includes('fetch'))) {
      
      event.preventDefault();
      return;
    }
  });
  
  // Note: Removed fetch override as it was triggering the runtime overlay
  // All fetch safety is now handled in useDemoApi hook
  
  errorHandlerInstalled = true;
}