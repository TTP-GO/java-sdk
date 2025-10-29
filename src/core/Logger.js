/**
 * Simple logger that can be toggled for production
 */
class Logger {
  static enabled = false; // Disabled by default for production
  
  static log(...args) {
    if (this.enabled) {
      console.log(...args);
    }
  }
  
  static warn(...args) {
    if (this.enabled) {
      // console.warn(...args);
    }
  }
  
  static error(...args) {
    // Always show errors
    console.error(...args);
  }
}

export default Logger;

