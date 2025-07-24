// Magic SDK specific error suppression
export const suppressMagicErrors = () => {
  if (typeof window !== 'undefined') {
    // Override console.error specifically for Magic SDK errors
    const originalError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      
      // Suppress Magic SDK extension errors
      if (message.includes('Could not establish connection') || 
          message.includes('Receiving end does not exist') ||
          message.includes('Extension context invalidated')) {
        return; // Silently ignore
      }
      
      originalError.apply(console, args);
    };
    
    // Override Promise rejection handling for Magic SDK
    const originalAddEventListener = window.addEventListener;
    window.addEventListener = function(type, listener, options) {
      if (type === 'unhandledrejection') {
        const wrappedListener = function(event) {
          const message = event.reason?.message || event.reason || '';
          
          // Suppress Magic SDK promise rejections
          if (message.includes('Could not establish connection') || 
              message.includes('Receiving end does not exist')) {
            event.preventDefault();
            return;
          }
          
          return listener.call(this, event);
        };
        
        return originalAddEventListener.call(this, type, wrappedListener, options);
      }
      
      return originalAddEventListener.call(this, type, listener, options);
    };
    
    console.log('🔇 Magic SDK error suppression active');
  }
};

// Initialize immediately
if (typeof window !== 'undefined') {
  suppressMagicErrors();
} 