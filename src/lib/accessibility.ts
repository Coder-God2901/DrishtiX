/**
 * Accessibility Utilities for WCAG 2.1 AA Compliance
 * 
 * This module provides utilities for implementing accessibility features
 * including keyboard navigation, focus management, ARIA attributes, and screen reader support.
 */

// Focus Management
export class FocusManager {
  private static focusHistory: HTMLElement[] = [];

  /**
   * Trap focus within a container (for modals, dialogs)
   */
  static trapFocus(container: HTMLElement) {
    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstElement.focus();

    return () => container.removeEventListener('keydown', handleKeyDown);
  }

  /**
   * Get all focusable elements within a container
   */
  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    return Array.from(container.querySelectorAll(selector));
  }

  /**
   * Save current focus and return a function to restore it
   */
  static saveFocus(): () => void {
    const activeElement = document.activeElement as HTMLElement;
    this.focusHistory.push(activeElement);

    return () => {
      const element = this.focusHistory.pop();
      element?.focus();
    };
  }

  /**
   * Move focus to an element
   */
  static moveFocusTo(element: HTMLElement | null) {
    if (!element) return;
    element.focus();
    element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// Keyboard Navigation
export class KeyboardNav {
  /**
   * Handle arrow key navigation in a list
   */
  static handleArrowNavigation(
    event: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    onIndexChange: (index: number) => void,
    orientation: 'horizontal' | 'vertical' = 'vertical'
  ) {
    const keys = orientation === 'vertical'
      ? { prev: 'ArrowUp', next: 'ArrowDown' }
      : { prev: 'ArrowLeft', next: 'ArrowRight' };

    switch (event.key) {
      case keys.prev:
        event.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        onIndexChange(prevIndex);
        items[prevIndex]?.focus();
        break;

      case keys.next:
        event.preventDefault();
        const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        onIndexChange(nextIndex);
        items[nextIndex]?.focus();
        break;

      case 'Home':
        event.preventDefault();
        onIndexChange(0);
        items[0]?.focus();
        break;

      case 'End':
        event.preventDefault();
        const lastIndex = items.length - 1;
        onIndexChange(lastIndex);
        items[lastIndex]?.focus();
        break;
    }
  }

  /**
   * Create keyboard shortcut handler
   */
  static createShortcutHandler(shortcuts: Record<string, () => void>) {
    return (event: KeyboardEvent) => {
      const key = [
        event.ctrlKey && 'Ctrl',
        event.altKey && 'Alt',
        event.shiftKey && 'Shift',
        event.key,
      ]
        .filter(Boolean)
        .join('+');

      const handler = shortcuts[key];
      if (handler) {
        event.preventDefault();
        handler();
      }
    };
  }
}

// ARIA Announcer
export class AriaAnnouncer {
  private static liveRegion: HTMLElement | null = null;

  /**
   * Initialize ARIA live region for announcements
   */
  static init() {
    if (this.liveRegion) return;

    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('role', 'status');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.className = 'sr-only';
    this.liveRegion.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;

    document.body.appendChild(this.liveRegion);
  }

  /**
   * Announce message to screen readers
   */
  static announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    if (!this.liveRegion) this.init();
    if (!this.liveRegion) return;

    this.liveRegion.setAttribute('aria-live', priority);
    this.liveRegion.textContent = '';

    setTimeout(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = message;
      }
    }, 100);
  }

  /**
   * Clear announcements
   */
  static clear() {
    if (this.liveRegion) {
      this.liveRegion.textContent = '';
    }
  }
}

// Color Contrast Utilities
export class ColorContrast {
  /**
   * Calculate relative luminance
   */
  static getLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map((c) => {
      const val = c / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  /**
   * Calculate contrast ratio between two colors
   */
  static getContrastRatio(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);

    if (!rgb1 || !rgb2) return 0;

    const lum1 = this.getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = this.getLuminance(rgb2.r, rgb2.g, rgb2.b);

    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Check if color combination meets WCAG AA standards
   */
  static meetsWCAG_AA(foreground: string, background: string, isLargeText = false): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
  }

  /**
   * Check if color combination meets WCAG AAA standards
   */
  static meetsWCAG_AAA(foreground: string, background: string, isLargeText = false): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  }

  private static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
      : null;
  }
}

// Skip Links
export class SkipLinks {
  /**
   * Add skip navigation links
   */
  static addSkipLinks(links: Array<{ label: string; target: string }>) {
    const container = document.createElement('div');
    container.className = 'skip-links';
    container.style.cssText = `
      position: absolute;
      top: -40px;
      left: 0;
      background: #000;
      color: #fff;
      z-index: 9999;
    `;

    links.forEach(({ label, target }) => {
      const link = document.createElement('a');
      link.href = `#${target}`;
      link.textContent = label;
      link.className = 'skip-link';
      link.style.cssText = `
        display: block;
        padding: 8px 16px;
        color: #fff;
        text-decoration: none;
      `;

      link.addEventListener('focus', () => {
        container.style.top = '0';
      });

      link.addEventListener('blur', () => {
        container.style.top = '-40px';
      });

      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetElement = document.getElementById(target);
        if (targetElement) {
          targetElement.tabIndex = -1;
          targetElement.focus();
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }
      });

      container.appendChild(link);
    });

    document.body.insertBefore(container, document.body.firstChild);
  }
}

// Screen Reader Text
export function srOnly(text: string): string {
  return `<span class="sr-only">${text}</span>`;
}

// High Contrast Mode Detection
export function detectHighContrastMode(): boolean {
  const testElement = document.createElement('div');
  testElement.style.cssText = `
    border: 1px solid;
    border-color: red green;
    position: absolute;
    height: 0;
    width: 0;
  `;

  document.body.appendChild(testElement);
  const computedStyle = window.getComputedStyle(testElement);
  const isHighContrast = computedStyle.borderTopColor === computedStyle.borderRightColor;
  document.body.removeChild(testElement);

  return isHighContrast;
}

// Reduce Motion Preference
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Initialize accessibility features
export function initAccessibility() {
  AriaAnnouncer.init();

  // Add skip links
  SkipLinks.addSkipLinks([
    { label: 'Skip to main content', target: 'main-content' },
    { label: 'Skip to navigation', target: 'main-nav' },
  ]);

  // Detect high contrast mode
  if (detectHighContrastMode()) {
    document.body.classList.add('high-contrast');
  }

  // Detect reduced motion preference
  if (prefersReducedMotion()) {
    document.body.classList.add('reduce-motion');
  }

  // Add focus visible polyfill class
  document.addEventListener('keydown', () => {
    document.body.classList.add('using-keyboard');
  });

  document.addEventListener('mousedown', () => {
    document.body.classList.remove('using-keyboard');
  });
}
