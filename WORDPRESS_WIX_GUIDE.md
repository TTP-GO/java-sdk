# WordPress & Wix Integration Guide

Integrating the TTP Agent SDK into WordPress or Wix is straightforward! The SDK works with just a simple script tag - no build process needed.

## Quick Overview

✅ **No build tools required**  
✅ **Works with script tag**  
✅ **Zero configuration** (if using direct agent/app ID)  
✅ **Customizable via simple JavaScript**

---

## WordPress Integration

### Method 1: Using Custom HTML Block (Easiest)

1. **Edit your WordPress page/post**
2. **Add a "Custom HTML" block**
3. **Paste this code:**

```html
<!-- Load TTP Agent SDK -->
<script src="https://unpkg.com/ttp-agent-sdk@2.2.2/dist/agent-widget.js"></script>

<script>
  // Initialize the widget when page loads
  window.addEventListener('DOMContentLoaded', function() {
    new TTPAgentSDK.AgentWidget({
      agentId: 'your_agent_id',
      appId: 'your_app_id',
      
      // Optional: Customize appearance
      primaryColor: '#10B981',
      position: 'bottom-right',
      
      // Optional: Custom icon
      icon: {
        type: 'custom',
        customImage: 'https://yourwebsite.com/logo.png',
        size: 'medium'
      },
      
      // Optional: Custom header
      header: {
        title: 'Support Assistant',
        backgroundColor: '#10B981'
      }
    });
  });
</script>
```

### Method 2: Using Theme's Footer (Site-Wide)

1. **Go to Appearance → Theme Editor → Footer (footer.php)**
2. **Add the code before `</body>` tag:**

```html
<script src="https://unpkg.com/ttp-agent-sdk@2.2.2/dist/agent-widget.js"></script>
<script>
  new TTPAgentSDK.AgentWidget({
    agentId: 'your_agent_id',
    appId: 'your_app_id',
    header: { title: 'Get Help' }
  });
</script>
```

### Method 3: Using a Plugin

Create a simple plugin to add the SDK site-wide:

**File: `wp-content/plugins/ttp-voice-agent/ttp-voice-agent.php`**

```php
<?php
/**
 * Plugin Name: TTP Voice Agent
 * Description: Add TTP Voice Agent widget to your WordPress site
 * Version: 1.0
 */

function ttp_voice_agent_script() {
    ?>
    <script src="https://unpkg.com/ttp-agent-sdk@2.2.2/dist/agent-widget.js"></script>
    <script>
      new TTPAgentSDK.AgentWidget({
        agentId: '<?php echo esc_js(get_option('ttp_agent_id', '')); ?>',
        appId: '<?php echo esc_js(get_option('ttp_app_id', '')); ?>',
        header: { title: '<?php echo esc_js(get_option('ttp_header_title', 'Voice Assistant')); ?>' }
      });
    </script>
    <?php
}
add_action('wp_footer', 'ttp_voice_agent_script');
```

---

## Wix Integration

### Method 1: Using HTML Code Element (Easiest)

1. **Edit your Wix site**
2. **Add → Embed → Custom Code (HTML iframe)**
3. **Or Add → Embed → HTML Code**
4. **Paste this code:**

```html
<script src="https://unpkg.com/ttp-agent-sdk@2.2.2/dist/agent-widget.js"></script>
<script>
  new TTPAgentSDK.AgentWidget({
    agentId: 'your_agent_id',
    appId: 'your_app_id',
    position: 'bottom-right',
    header: { title: 'Support Chat' }
  });
</script>
```

### Method 2: Using Site Settings → Custom Code

1. **Settings → Custom Code**
2. **Add Code → Body - Start**
3. **Paste the script tags:**

```html
<script src="https://unpkg.com/ttp-agent-sdk@2.2.2/dist/agent-widget.js"></script>
<script>
  window.addEventListener('DOMContentLoaded', function() {
    new TTPAgentSDK.AgentWidget({
      agentId: 'your_agent_id',
      appId: 'your_app_id'
    });
  });
</script>
```

### Important for Wix:
- The code must be added to **Body - Start** or in an **HTML Code element**
- Some Wix templates may require placing it in the **Footer** section

---

## Production Setup (Recommended)

For production, use **signed links** instead of exposing agent IDs. Here's how:

### WordPress / Wix with Signed Links

```html
<script src="https://unpkg.com/ttp-agent-sdk@2.2.2/dist/agent-widget.js"></script>
<script>
  new TTPAgentSDK.AgentWidget({
    agentId: 'your_agent_id',
    appId: 'your_app_id',
    
    // Use your backend to generate signed URLs
    getSessionUrl: async ({ agentId, appId, variables }) => {
      const response = await fetch('https://your-backend.com/api/get-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, appId, variables })
      });
      const data = await response.json();
      return data.signedUrl;
    }
  });
</script>
```

**Note:** This requires a backend endpoint that generates signed URLs. Contact TTP support for backend integration assistance.

---

## Full Customization Example

Here's a complete example with all customization options:

```html
<script src="https://unpkg.com/ttp-agent-sdk@2.2.2/dist/agent-widget.js"></script>
<script>
  new TTPAgentSDK.AgentWidget({
    agentId: 'your_agent_id',
    appId: 'your_app_id',
    
    // Colors
    primaryColor: '#10B981',
    
    // Position
    position: 'bottom-right', // or 'bottom-left', 'top-right', 'top-left'
    
    // Icon
    icon: {
      type: 'custom',
      customImage: 'https://yourwebsite.com/logo.png',
      size: 'medium',
      backgroundColor: '#FFFFFF'
    },
    
    // Floating Button
    button: {
      backgroundColor: '#FFFFFF',
      hoverColor: '#E5E7EB',
      size: 'medium',
      shape: 'circle'
    },
    
    // Header
    header: {
      title: 'TTP Support',
      backgroundColor: '#10B981',
      textColor: '#FFFFFF'
    },
    
    // Panel/Mic Button
    panel: {
      micButtonColor: '#E5E7EB',
      micButtonActiveColor: '#EF4444',
      micButtonHint: {
        text: 'Click to start voice conversation',
        color: '#6B7280',
        fontSize: '12px'
      }
    },
    
    // Text Direction (for RTL languages)
    direction: 'ltr', // or 'rtl' for Hebrew, Arabic, etc.
    
    // Pass custom variables
    variables: {
      page: 'contact',
      userId: 'user123'
    }
  });
</script>
```

---

## Troubleshooting

### Widget not appearing?

1. **Check browser console** for JavaScript errors
2. **Verify script loads**: Check Network tab to see if `agent-widget.js` loaded
3. **Check agent/app IDs**: Make sure they're correct
4. **Z-index issues**: The widget uses `z-index: 10000` - if your theme has higher z-index, you may need to adjust

### Mobile issues?

- The widget is mobile-responsive by default
- Make sure your theme doesn't hide elements on mobile with CSS
- Check that the script tag is in the `<body>` or `wp_footer` hook

### WordPress Security Plugins?

Some security plugins may block external scripts. You may need to:
- Whitelist `unpkg.com` in your security plugin
- Or download the SDK file and host it on your own server

---

## Hosting Your Own SDK File

If you prefer to host the SDK file yourself:

1. Download: `https://unpkg.com/ttp-agent-sdk@2.2.2/dist/agent-widget.js`
2. Upload to your WordPress media library or Wix assets
3. Update the script `src` to point to your hosted file

---

## Support

For questions or issues:
- Check the [GitHub Repository](https://github.com/yinon11/ttp-sdk-front)
- See [GETTING_STARTED.md](./GETTING_STARTED.md) for more examples
- See [ENHANCED_WIDGET_GUIDE.md](./ENHANCED_WIDGET_GUIDE.md) for all options

