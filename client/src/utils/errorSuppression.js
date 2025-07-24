// Comprehensive error suppression for browser extensions and analytics
export const suppressBrowserWarnings = () => {
  if (typeof window !== 'undefined') {
    // Store original console methods
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;

    // Patterns to suppress
    const suppressedErrors = [
      'Could not establish connection',
      'Receiving end does not exist',
      'net::ERR_BLOCKED_BY_CLIENT',
      'events.launchdarkly.com',
      'browser-intake-datadoghq.com',
      'Failed to load resource'
    ];

    const suppressedWarnings = [
      'Redefining LocalForage driver',
      'LaunchDarkly client initialized',
      'events.launchdarkly.com',
      'browser-intake-datadoghq.com',
      'React Router will begin wrapping state updates',
      'v7_startTransition future flag'
    ];

    const suppressedLogs = [
      'LaunchDarkly client initialized'
    ];

    // Helper function to check if message should be suppressed
    const shouldSuppress = (message, patterns) => {
      return patterns.some(pattern => message.includes(pattern));
    };

    // Override console.error
    console.error = (...args) => {
      const message = args.join(' ');
      
      if (shouldSuppress(message, suppressedErrors)) {
        return; // Silently ignore
      }
      
      originalError.apply(console, args);
    };

    // Override console.warn
    console.warn = (...args) => {
      const message = args.join(' ');
      
      if (shouldSuppress(message, suppressedWarnings)) {
        return; // Silently ignore
      }
      
      originalWarn.apply(console, args);
    };

    // Override console.log
    console.log = (...args) => {
      const message = args.join(' ');
      
      if (shouldSuppress(message, suppressedLogs)) {
        return; // Silently ignore
      }
      
      originalLog.apply(console, args);
    };

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const message = event.reason?.message || event.reason || '';
      
      if (shouldSuppress(message, suppressedErrors)) {
        event.preventDefault();
        return;
      }
    });

    // Handle global errors
    window.addEventListener('error', (event) => {
      const message = event.message || event.error?.message || '';
      
      if (shouldSuppress(message, suppressedErrors)) {
        event.preventDefault();
        return;
      }
    });

    // Override window.addEventListener to catch errors earlier
    const originalAddEventListener = window.addEventListener;
    window.addEventListener = function(type, listener, options) {
      if (type === 'error' || type === 'unhandledrejection') {
        const wrappedListener = function(event) {
          const message = event.message || event.error?.message || event.reason?.message || '';
          
          if (shouldSuppress(message, suppressedErrors)) {
            event.preventDefault();
            return;
          }
          
          return listener.call(this, event);
        };
        
        return originalAddEventListener.call(this, type, wrappedListener, options);
      }
      
      return originalAddEventListener.call(this, type, listener, options);
    };

    console.log('🔇 Browser warning suppression active');
  }
};

// Initialize immediately and also on DOM ready
if (typeof window !== 'undefined') {
  // Apply suppression immediately
  suppressBrowserWarnings();
  
  // Also apply when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', suppressBrowserWarnings);
  } else {
    suppressBrowserWarnings();
  }
  
  // Apply on window load as well
  window.addEventListener('load', suppressBrowserWarnings);
} 