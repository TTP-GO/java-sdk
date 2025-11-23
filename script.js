// ===== Navigation & Scroll Behavior =====

// Smooth scroll to sections
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', function(e) {
    // Only handle internal links (hash links)
    if (this.getAttribute('href').startsWith('#')) {
      e.preventDefault();
      
      // Get target section
      const targetId = this.getAttribute('href');
      const targetSection = document.querySelector(targetId);
      
      if (targetSection) {
        // Smooth scroll to section
        targetSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        
        // Update URL without page jump
        history.pushState(null, null, targetId);
        
        // Manually update active state immediately (scroll spy will take over during scroll)
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        this.classList.add('active');
      }
    }
  });
});

// Improved scroll spy - highlight active section on scroll
function updateActiveLink() {
  const sections = document.querySelectorAll('.doc-section');
  const scrollPosition = window.scrollY + 200; // Offset for better detection
  
  let currentSection = null;
  let minDistance = Infinity;
  
  // Find the section closest to current scroll position
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const distance = Math.abs(scrollPosition - sectionTop);
    
    // If this section is above or at scroll position and closer than previous
    if (scrollPosition >= sectionTop - 100 && distance < minDistance) {
      minDistance = distance;
      currentSection = section;
    }
  });
  
  // If we're near the top of the page, use the first section
  if (scrollPosition < 300) {
    currentSection = sections[0];
  }
  
  // If we're at the bottom of the page, use the last section
  if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 100) {
    currentSection = sections[sections.length - 1];
  }
  
  if (currentSection) {
    const id = currentSection.getAttribute('id');
    const correspondingLink = document.querySelector(`.nav-link[href="#${id}"]`);
    
    if (correspondingLink && !correspondingLink.classList.contains('active')) {
      // Remove active class from all links
      document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
      });
      
      // Add active class to corresponding link
      correspondingLink.classList.add('active');
      
      // Scroll the active link into view in sidebar
      const sidebar = document.querySelector('.sidebar');
      const linkTop = correspondingLink.offsetTop;
      const linkHeight = correspondingLink.offsetHeight;
      const sidebarHeight = sidebar.clientHeight;
      const sidebarScroll = sidebar.scrollTop;
      
      // Check if link is not fully visible
      if (linkTop < sidebarScroll || linkTop + linkHeight > sidebarScroll + sidebarHeight) {
        correspondingLink.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
      
      // Update URL without jumping
      history.replaceState(null, null, `#${id}`);
    }
  }
}

// Better throttle function with leading edge execution
function throttle(func, wait) {
  let timeout = null;
  let lastRan = null;
  
  return function executedFunction(...args) {
    if (!lastRan) {
      func.apply(this, args);
      lastRan = Date.now();
    } else {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if ((Date.now() - lastRan) >= wait) {
          func.apply(this, args);
          lastRan = Date.now();
        }
      }, wait - (Date.now() - lastRan));
    }
  };
}

// Update active link on scroll (throttled)
window.addEventListener('scroll', throttle(updateActiveLink, 150));

// Initial update on load and after DOM is ready
window.addEventListener('load', () => {
  setTimeout(updateActiveLink, 200);
});

// Also update on resize (sections might move)
window.addEventListener('resize', throttle(updateActiveLink, 300));

// ===== Mobile Menu Toggle =====

// Create mobile overlay
const mobileOverlay = document.createElement('div');
mobileOverlay.className = 'mobile-overlay';
document.body.appendChild(mobileOverlay);

// Create mobile menu button if not exists
if (window.innerWidth <= 768) {
  const mobileMenuBtn = document.createElement('button');
  mobileMenuBtn.className = 'mobile-menu-btn';
  mobileMenuBtn.innerHTML = '☰';
  mobileMenuBtn.setAttribute('aria-label', 'Toggle menu');
  document.body.appendChild(mobileMenuBtn);
  
  const sidebar = document.querySelector('.sidebar');
  
  function toggleMobileMenu(open) {
    if (open) {
      sidebar.classList.add('open');
      mobileOverlay.classList.add('active');
      mobileMenuBtn.classList.add('menu-open');
      mobileMenuBtn.innerHTML = '✕';
      document.body.style.overflow = 'hidden'; // Prevent scrolling
    } else {
      sidebar.classList.remove('open');
      mobileOverlay.classList.remove('active');
      mobileMenuBtn.classList.remove('menu-open');
      mobileMenuBtn.innerHTML = '☰';
      document.body.style.overflow = ''; // Restore scrolling
    }
  }
  
  mobileMenuBtn.addEventListener('click', () => {
    toggleMobileMenu(!sidebar.classList.contains('open'));
  });
  
  // Close sidebar when clicking on overlay
  mobileOverlay.addEventListener('click', () => {
    toggleMobileMenu(false);
  });
  
  // Close sidebar when clicking on a link
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        toggleMobileMenu(false);
      }
    });
  });
}

// ===== Handle Initial Hash on Page Load =====
window.addEventListener('DOMContentLoaded', () => {
  // Run scroll spy on initial load
  setTimeout(updateActiveLink, 100);
  
  if (window.location.hash) {
    const targetId = window.location.hash;
    const targetSection = document.querySelector(targetId);
    const targetLink = document.querySelector(`.nav-link[href="${targetId}"]`);
    
    if (targetSection && targetLink) {
      // Remove active from all
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      
      // Add active to target
      targetLink.classList.add('active');
      
      // Scroll to section after a small delay
      setTimeout(() => {
        targetSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        // Update scroll spy after scrolling
        setTimeout(updateActiveLink, 500);
      }, 100);
    }
  }
});

// ===== Copy Code Button =====
document.querySelectorAll('pre code').forEach(block => {
  // Create wrapper
  const wrapper = document.createElement('div');
  wrapper.style.position = 'relative';
  
  // Wrap the pre element
  block.parentElement.parentNode.insertBefore(wrapper, block.parentElement);
  wrapper.appendChild(block.parentElement);
  
  // Create copy button
  const copyBtn = document.createElement('button');
  copyBtn.innerHTML = '📋 Copy';
  copyBtn.className = 'copy-code-btn';
  copyBtn.style.cssText = `
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
  `;
  
  copyBtn.addEventListener('mouseenter', () => {
    copyBtn.style.background = 'rgba(255, 255, 255, 0.2)';
  });
  
  copyBtn.addEventListener('mouseleave', () => {
    copyBtn.style.background = 'rgba(255, 255, 255, 0.1)';
  });
  
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(block.textContent);
      copyBtn.innerHTML = '✓ Copied!';
      copyBtn.style.background = '#10b981';
      
      setTimeout(() => {
        copyBtn.innerHTML = '📋 Copy';
        copyBtn.style.background = 'rgba(255, 255, 255, 0.1)';
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      copyBtn.innerHTML = '✗ Failed';
      setTimeout(() => {
        copyBtn.innerHTML = '📋 Copy';
      }, 2000);
    }
  });
  
  wrapper.appendChild(copyBtn);
});

// ===== Search Functionality (Optional Enhancement) =====
// Keyboard shortcut for quick navigation
document.addEventListener('keydown', (e) => {
  // Press '/' to focus search (if search is added later)
  if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
    e.preventDefault();
    // Search functionality can be added here
  }
  
  // Press 'Escape' to close mobile menu
  if (e.key === 'Escape' && window.innerWidth <= 768) {
    const sidebar = document.querySelector('.sidebar');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const overlay = document.querySelector('.mobile-overlay');
    if (sidebar && sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
      if (mobileMenuBtn) {
        mobileMenuBtn.classList.remove('menu-open');
        mobileMenuBtn.innerHTML = '☰';
      }
    }
  }
});

// ===== Scroll to Top Button =====
const scrollToTopBtn = document.createElement('button');
scrollToTopBtn.innerHTML = '↑';
scrollToTopBtn.className = 'scroll-to-top';
scrollToTopBtn.style.cssText = `
  position: fixed;
  bottom: 30px;
  right: 30px;
  background: linear-gradient(135deg, #667eea 0%, #5a67d8 100%);
  color: white;
  border: none;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  z-index: 1000;
`;

document.body.appendChild(scrollToTopBtn);

// Show/hide scroll to top button
window.addEventListener('scroll', () => {
  if (window.pageYOffset > 300) {
    scrollToTopBtn.style.opacity = '1';
    scrollToTopBtn.style.visibility = 'visible';
  } else {
    scrollToTopBtn.style.opacity = '0';
    scrollToTopBtn.style.visibility = 'hidden';
  }
});

scrollToTopBtn.addEventListener('click', () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});

scrollToTopBtn.addEventListener('mouseenter', () => {
  scrollToTopBtn.style.transform = 'scale(1.1)';
});

scrollToTopBtn.addEventListener('mouseleave', () => {
  scrollToTopBtn.style.transform = 'scale(1)';
});

// ===== Table of Contents Generation (for long sections) =====
// Automatically generate in-page ToC if needed
// This is optional and can be enabled per section

console.log('📚 TTP Agent SDK Documentation Loaded');
console.log('🎯 Navigate using the sidebar or scroll to explore');

