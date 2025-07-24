// Network-level error suppression for analytics and external services
export const suppressNetworkErrors = () => {
  if (typeof window !== 'undefined') {
    // Block analytics domains
    const blockedDomains = [
      'launchdarkly.com',
      'datadoghq.com',
      'events.launchdarkly.com',
      'browser-intake-datadoghq.com'
    ];
    
    const isBlockedDomain = (url) => {
      const urlStr = String(url);
      return blockedDomains.some(domain => urlStr.includes(domain));
    };
    
    // Override fetch to block analytics requests
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
      if (isBlockedDomain(url)) {
        // Return a successful response to prevent errors
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({}),
          text: () => Promise.resolve(''),
          blob: () => Promise.resolve(new Blob()),
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(0))
        });
      }
      return originalFetch.apply(this, arguments);
    };
    
    // Override XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      if (isBlockedDomain(url)) {
        this._blocked = true;
        return;
      }
      this._blocked = false;
      return originalXHROpen.apply(this, [method, url, ...args]);
    };
    
    const originalXHRSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function(data) {
      if (this._blocked) {
        // Simulate successful response
        setTimeout(() => {
          this.readyState = 4;
          this.status = 200;
          this.responseText = '';
          this.onreadystatechange && this.onreadystatechange();
        }, 0);
        return;
      }
      return originalXHRSend.apply(this, arguments);
    };
    
    // Override sendBeacon
    const originalSendBeacon = navigator.sendBeacon;
    navigator.sendBeacon = function(url, data) {
      if (isBlockedDomain(url)) {
        return true;
      }
      return originalSendBeacon.apply(this, arguments);
    };
    
    // Suppress network error messages
    const originalError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      
      // Suppress network blocking errors
      if (message.includes('net::ERR_BLOCKED_BY_CLIENT') ||
          message.includes('Failed to load resource') ||
          message.includes('launchdarkly.com') ||
          message.includes('datadoghq.com')) {
        return;
      }
      
      originalError.apply(console, args);
    };
    
    console.log('🔇 Network error suppression active');
  }
};

// Initialize immediately
if (typeof window !== 'undefined') {
  suppressNetworkErrors();
} 