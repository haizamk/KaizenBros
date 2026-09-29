import html2canvas from 'html2canvas';

/**
 * Converts any CSS `oklch(...)` color string into standard `rgb(...)` or `#rrggbb` format
 * using browser native Canvas 2D color resolution.
 */
export function convertOklchToRgbFallback(oklchStr: string): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '#10b981';

    // Set a sentinel initial fill style
    ctx.fillStyle = 'rgba(1, 2, 3, 0.5)';
    ctx.fillStyle = oklchStr;

    // If ctx.fillStyle changed, the browser successfully converted oklch to rgb/hex
    if (ctx.fillStyle !== 'rgba(1, 2, 3, 0.5)') {
      return ctx.fillStyle;
    }
  } catch (e) {
    console.warn('Could not parse oklch color string:', oklchStr, e);
  }
  return '#10b981'; // Safe emerald default fallback
}

/**
 * Safely executes html2canvas while stripping unsupported `oklch(...)` CSS functions
 * from stylesheets and DOM elements to prevent html2canvas parsing crashes.
 */
export const safeCaptureHtmlToCanvas = async (
  element: HTMLElement,
  options: NonNullable<Parameters<typeof html2canvas>[1]> = {}
): Promise<HTMLCanvasElement> => {
  return html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    ...options,
    onclone: (clonedDoc, clonedElement) => {
      // 1. Convert <link rel="stylesheet"> tags into sanitized <style> tags
      const linkTags = Array.from(clonedDoc.querySelectorAll('link[rel="stylesheet"]'));
      linkTags.forEach((link) => {
        try {
          const sheet = (link as HTMLLinkElement).sheet;
          if (sheet) {
            const rules = Array.from(sheet.cssRules || []);
            const cssText = rules.map((r) => r.cssText).join('\n');
            if (cssText) {
              const sanitizedCss = cssText.replace(/oklch\([^\)]+\)/gi, (match) => convertOklchToRgbFallback(match));
              const newStyle = clonedDoc.createElement('style');
              newStyle.textContent = sanitizedCss;
              clonedDoc.head.appendChild(newStyle);
              link.remove();
            }
          }
        } catch (e) {
          // If CORS prevents reading sheet rules, leave link intact
        }
      });

      // 2. Sanitize all inline <style> tags in cloned document
      const styleTags = Array.from(clonedDoc.querySelectorAll('style'));
      styleTags.forEach((styleTag) => {
        if (styleTag.textContent && styleTag.textContent.toLowerCase().includes('oklch')) {
          styleTag.textContent = styleTag.textContent.replace(/oklch\([^\)]+\)/gi, (match) => {
            return convertOklchToRgbFallback(match);
          });
        }
      });

      // 3. Sanitize all inline style attributes in DOM nodes
      const allNodes = clonedDoc.querySelectorAll('*');
      allNodes.forEach((node) => {
        const styleAttr = node.getAttribute('style');
        if (styleAttr && styleAttr.toLowerCase().includes('oklch')) {
          const sanitizedStyle = styleAttr.replace(/oklch\([^\)]+\)/gi, (match) => {
            return convertOklchToRgbFallback(match);
          });
          node.setAttribute('style', sanitizedStyle);
        }
      });

      // 4. Invoke user-defined onclone callback if provided
      if (options.onclone) {
        options.onclone(clonedDoc, clonedElement);
      }
    },
  });
};

/**
 * Downloads a DOM element as a PNG image file.
 */
export const downloadElementAsPng = async (
  elementId: string,
  fileName: string,
  onStart?: () => void,
  onEnd?: () => void
): Promise<boolean> => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found for PNG download.`);
    return false;
  }

  try {
    if (onStart) onStart();
    const canvas = await safeCaptureHtmlToCanvas(element);
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
    link.click();
    return true;
  } catch (err) {
    console.error(`Failed to generate PNG image for ${elementId}:`, err);
    return false;
  } finally {
    if (onEnd) onEnd();
  }
};
