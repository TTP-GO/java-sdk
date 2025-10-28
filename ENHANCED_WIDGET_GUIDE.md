# Enhanced AgentWidget - Complete Customization Guide

The `EnhancedAgentWidget` provides extensive customization options while maintaining sensible defaults. Users can customize icons, positioning, colors, animations, and much more.

## Quick Start

```javascript
import { EnhancedAgentWidget } from 'ttp-agent-sdk';

// Minimal configuration (uses all defaults)
new EnhancedAgentWidget({
  agentId: 'your_agent_id',
  getSessionUrl: async ({ agentId, variables }) => {
    const response = await fetch('/api/get-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId, variables })
    });
    const data = await response.json();
    return data.signedUrl;
  }
});
```

## Complete Configuration Options

### Required Configuration

```javascript
{
  agentId: 'your_agent_id',           // Required: Your agent ID
  getSessionUrl: async ({ agentId, variables }) => { ... }  // Required: Function to get signed URL
}
```

### Icon/Image Configuration

```javascript
{
  icon: {
    type: 'microphone',              // 'microphone', 'custom', 'emoji', 'text'
    customImage: 'https://example.com/icon.png',  // URL for custom image
    emoji: '🎤',                     // Emoji to display
    text: 'AI',                      // Text to display
    size: 'medium'                   // 'small', 'medium', 'large', 'xl'
  }
}
```

**Icon Examples:**
```javascript
// Custom image
icon: { type: 'custom', customImage: 'https://example.com/my-logo.png' }

// Emoji
icon: { type: 'emoji', emoji: '🤖', size: 'large' }

// Text
icon: { type: 'text', text: 'HELP', size: 'small' }

// Default microphone
icon: { type: 'microphone' }
```

### Positioning Configuration

```javascript
{
  position: {
    vertical: 'bottom',              // 'top', 'bottom', 'center'
    horizontal: 'right',             // 'left', 'right', 'center'
    offset: { x: 20, y: 20 }         // Custom offset in pixels
  }
}
```

**Position Examples:**
```javascript
// Top-left corner
position: { vertical: 'top', horizontal: 'left' }

// Center of screen
position: { vertical: 'center', horizontal: 'center' }

// Custom offset from bottom-right
position: { 
  vertical: 'bottom', 
  horizontal: 'right', 
  offset: { x: 50, y: 100 } 
}
```

### Button Configuration

```javascript
{
  button: {
    size: 'medium',                  // 'small', 'medium', 'large', 'xl'
    shape: 'circle',                 // 'circle', 'square', 'rounded'
    primaryColor: '#4F46E5',         // Main button color
    hoverColor: '#7C3AED',           // Hover state color
    activeColor: '#EF4444',          // Active/recording color
    shadow: true,                    // Enable shadow
    shadowColor: 'rgba(0,0,0,0.15)' // Shadow color
  }
}
```

### Panel Configuration

```javascript
{
  panel: {
    width: 350,                      // Panel width in pixels
    height: 500,                     // Panel height in pixels
    borderRadius: 12,                // Border radius in pixels
    backgroundColor: 'rgba(255,255,255,0.95)',  // Panel background
    backdropFilter: 'blur(10px)',    // Backdrop filter effect
    border: '1px solid rgba(0,0,0,0.1)'  // Panel border
  }
}
```

### Header Configuration

```javascript
{
  header: {
    title: 'Voice Assistant',        // Header title
    showTitle: true,                 // Show/hide title
    backgroundColor: null,            // null = uses button primaryColor
    textColor: '#FFFFFF',            // Header text color
    showCloseButton: true            // Show/hide close button
  }
}
```

### Messages Configuration

```javascript
{
  messages: {
    userBackgroundColor: '#E5E7EB',      // User message background
    agentBackgroundColor: '#F3F4F6',     // Agent message background
    systemBackgroundColor: '#DCFCE7',    // System message background
    errorBackgroundColor: '#FEE2E2',     // Error message background
    textColor: '#1F2937',                // Text color
    fontSize: '14px',                    // Font size
    borderRadius: 8                      // Message border radius
  }
}
```

### Animation Configuration

```javascript
{
  animation: {
    enableHover: true,               // Enable hover animations
    enablePulse: true,               // Enable pulse animation when recording
    enableSlide: true,               // Enable slide animations
    duration: 0.3                    // Animation duration in seconds
  }
}
```

### Behavior Configuration

```javascript
{
  behavior: {
    autoOpen: false,                 // Auto-open panel on load
    autoConnect: false,              // Auto-connect on load
    showWelcomeMessage: true,        // Show welcome message
    welcomeMessage: 'Hello! How can I help you today?'  // Welcome message text
  }
}
```

### Accessibility Configuration

```javascript
{
  accessibility: {
    ariaLabel: 'Voice Assistant',    // ARIA label for button
    ariaDescription: 'Click to open voice assistant',  // ARIA description
    keyboardNavigation: true         // Enable keyboard navigation (ESC to close)
  }
}
```

### Custom CSS

```javascript
{
  customStyles: `
    #enhanced-agent-widget {
      /* Your custom CSS here */
    }
  `
}
```

## Complete Example

```javascript
import { EnhancedAgentWidget } from 'ttp-agent-sdk';

const widget = new EnhancedAgentWidget({
  // Required
  agentId: 'my_agent_123',
  getSessionUrl: async ({ agentId, variables }) => {
    const response = await fetch('/api/get-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId, variables })
    });
    const data = await response.json();
    return data.signedUrl;
  },
  
  // Custom icon (company logo)
  icon: {
    type: 'custom',
    customImage: 'https://mycompany.com/logo.png',
    size: 'large'
  },
  
  // Position in top-left
  position: {
    vertical: 'top',
    horizontal: 'left',
    offset: { x: 30, y: 30 }
  },
  
  // Brand colors
  button: {
    size: 'large',
    shape: 'rounded',
    primaryColor: '#FF6B35',
    hoverColor: '#FF8C42',
    activeColor: '#FF4444'
  },
  
  // Custom panel styling
  panel: {
    width: 400,
    height: 600,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 20,
    backdropFilter: 'blur(15px)'
  },
  
  // Custom header
  header: {
    title: 'My Company Assistant',
    backgroundColor: '#FF6B35',
    textColor: '#FFFFFF'
  },
  
  // Custom messages
  messages: {
    userBackgroundColor: '#FF6B35',
    agentBackgroundColor: '#F0F0F0',
    textColor: '#333333',
    fontSize: '16px'
  },
  
  // Smooth animations
  animation: {
    enableHover: true,
    enablePulse: true,
    enableSlide: true,
    duration: 0.4
  },
  
  // Auto-open for demo
  behavior: {
    autoOpen: true,
    welcomeMessage: 'Welcome to My Company! How can I assist you?'
  },
  
  // Custom variables
  variables: {
    company: 'My Company',
    page: 'homepage',
    userType: 'visitor'
  }
});
```

## Public API Methods

```javascript
// Update configuration dynamically
widget.updateConfig({
  button: { primaryColor: '#00FF00' },
  position: { vertical: 'top' }
});

// Destroy the widget
widget.destroy();
```

## Migration from Original AgentWidget

The enhanced widget is fully backward compatible. Simply replace:

```javascript
// Old
import { AgentWidget } from 'ttp-agent-sdk';
new AgentWidget({ ... });

// New
import { EnhancedAgentWidget } from 'ttp-agent-sdk';
new EnhancedAgentWidget({ ... });
```

All existing configurations will work with sensible defaults applied.

## Browser Support

- Chrome 66+
- Firefox 60+
- Safari 11.1+
- Edge 79+

## License

MIT
