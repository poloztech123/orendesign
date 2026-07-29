/**
 * Oren Design & Build Watermark & Branding Utility
 */

async function loadCanvasImage(url: string): Promise<HTMLImageElement> {
  // Case 1: Data URL or Blob URL - load directly without adding query params
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load data/blob image'));
      img.src = url;
    });
  }

  // Case 2: HTTP / HTTPS URL - Fetch direct as blob to avoid canvas CORS contamination
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      return await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          resolve(img);
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Failed to load fetched blob URL'));
        };
        img.src = objectUrl;
      });
    }
  } catch (err) {
    console.warn("Direct fetch for watermark image failed, trying fallback...", err);
  }

  // Case 3: Try proxy fetch (images.weserv.nl)
  try {
    const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      return await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          resolve(img);
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Failed to load proxy blob URL'));
        };
        img.src = objectUrl;
      });
    }
  } catch (err) {
    console.warn("Proxy fetch for watermark image failed, trying crossOrigin Image...", err);
  }

  // Case 4: Standard crossOrigin Image element
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image via crossOrigin Image element'));
    const separator = url.includes('?') ? '&' : '?';
    img.src = `${url}${separator}nocache=${Date.now()}`;
  });
}

export async function downloadWatermarkedImage(imageUrl: string, planName: string, projectNo?: string): Promise<void> {
  try {
    // Load main plan image cleanly using robust multi-strategy loader
    const img = await loadCanvasImage(imageUrl);

    // Load logo and whatsapp icon asynchronously with vector fallbacks
    let logoImg: HTMLImageElement | null = null;
    let whatsappImg: HTMLImageElement | null = null;

    const logoCandidateUrls = [
      'https://orend-e6abe.web.app/img/Oren.png',
      '/img/Oren.png',
      './img/Oren.png'
    ];

    for (const logoUrl of logoCandidateUrls) {
      try {
        logoImg = await loadCanvasImage(logoUrl);
        if (logoImg && logoImg.naturalWidth > 0) break;
      } catch (err) {
        console.warn(`Logo candidate ${logoUrl} failed to load:`, err);
      }
    }

    try {
      whatsappImg = await loadCanvasImage('https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg');
    } catch {
      console.warn("WhatsApp icon failed to load, will use vector fallback");
    }

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || img.width || 1200;
    canvas.height = img.naturalHeight || img.height || 800;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not obtain 2D canvas context");
    }

    // 1. Draw original render
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // 2. Center Giant Semi-transparent Watermark
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    
    // Adjusted font size to make the center watermarked word smaller as requested
    const centerFontSize = Math.max(24, Math.floor(canvas.width * 0.048));
    ctx.font = `bold ${centerFontSize}px "Inter", "Helvetica Neue", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
    ctx.shadowBlur = Math.max(3, centerFontSize * 0.06);
    ctx.shadowOffsetX = Math.max(1, centerFontSize * 0.015);
    ctx.shadowOffsetY = Math.max(1, centerFontSize * 0.015);
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.fillText("www.orendesignandbuild.com", 0, 0);
    
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = "rgba(0, 0, 0, 0.55)";
    ctx.lineWidth = Math.max(1.5, centerFontSize * 0.02);
    ctx.strokeText("www.orendesignandbuild.com", 0, 0);
    
    ctx.restore();

    // 3. Details banner at bottom with gradient background
    ctx.save();
    const bannerHeight = Math.max(140, Math.floor(canvas.height * 0.15));
    const bannerY = canvas.height - bannerHeight;

    const grad = ctx.createLinearGradient(0, bannerY - 30, 0, canvas.height);
    grad.addColorStop(0, "rgba(0, 0, 0, 0)");
    grad.addColorStop(0.3, "rgba(0, 0, 0, 0.45)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0.85)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, bannerY - 30, canvas.width, bannerHeight + 30);

    const paddingX = Math.max(28, Math.floor(canvas.width * 0.05));

    ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 1.5;
    ctx.shadowOffsetY = 1.5;

    // Green vertical bar (Oren signature green)
    const barWidth = Math.max(4, Math.floor(bannerHeight * 0.035));
    const barHeight = bannerHeight * 0.48;
    const barX = paddingX;
    const barYPosition = bannerY + bannerHeight * 0.26;
    ctx.fillStyle = "#84e114";
    ctx.fillRect(barX, barYPosition, barWidth, barHeight);

    const textStartX = paddingX + barWidth + Math.max(10, Math.floor(bannerHeight * 0.08));

    const nameClean = planName.toUpperCase().replace("THE ", "").replace(" PLAN", "").replace(/\s+/g, "");
    const deterministicNum = 1000 + (planName.length * 47) % 9000;
    const projectId = projectNo || `ID-${nameClean.substring(0, 4)}-${deterministicNum}`;

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    // Line 1: Main Title
    const line1Size = Math.max(16, Math.floor(bannerHeight * 0.19));
    ctx.font = `bold ${line1Size}px "Inter", system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Explore the Floor Plans & Full Project Details", textStartX, bannerY + bannerHeight * 0.36);

    // Line 2: Details with inline domain text
    const line2Size = Math.max(11, Math.floor(bannerHeight * 0.125));
    ctx.font = `500 ${line2Size}px "Inter", system-ui, -apple-system, sans-serif`;
    
    const textPart1 = "Available now on ";
    const textPart2 = "www.orendesignandbuild.com";
    const textPart3 = `  |  Project No: ${projectId}`;
    
    let currentX = textStartX;
    ctx.fillStyle = "#f3f4f6";
    ctx.fillText(textPart1, currentX, bannerY + bannerHeight * 0.68);
    currentX += ctx.measureText(textPart1).width;
    
    ctx.fillStyle = "#84e114";
    ctx.fillText(textPart2, currentX, bannerY + bannerHeight * 0.68);
    currentX += ctx.measureText(textPart2).width;
    
    ctx.fillStyle = "#f3f4f6";
    ctx.fillText(textPart3, currentX, bannerY + bannerHeight * 0.68);

    // Draw Oren Logo (Significantly bigger logo in watermark)
    if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
      const logoAspect = logoImg.naturalHeight / logoImg.naturalWidth || 180 / 540;
      const targetLogoHeight = Math.max(54, Math.floor(bannerHeight * 0.48));
      const targetLogoWidth = targetLogoHeight / logoAspect;
      const logoX = canvas.width - paddingX - targetLogoWidth;
      const logoY = bannerY + bannerHeight * 0.36 - targetLogoHeight / 2;
      
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 1.5;
      ctx.shadowOffsetY = 1.5;
      ctx.drawImage(logoImg, logoX, logoY, targetLogoWidth, targetLogoHeight);
      ctx.restore();
    } else {
      drawFallbackLogo(ctx, canvas.width - paddingX, bannerY + bannerHeight * 0.36, bannerHeight);
    }

    // Draw WhatsApp contact info
    const phoneText = "+256 773 633868";
    const phoneFontSize = Math.max(13, Math.floor(bannerHeight * 0.16));
    ctx.font = `bold ${phoneFontSize}px "Inter", system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    
    const phoneY = bannerY + bannerHeight * 0.68;
    ctx.fillText(phoneText, canvas.width - paddingX, phoneY);
    
    const phoneWidth = ctx.measureText(phoneText).width;
    const iconSize = Math.max(14, Math.floor(bannerHeight * 0.16));
    const iconX = canvas.width - paddingX - phoneWidth - iconSize - 8;
    const iconY = phoneY - iconSize / 2;
    
    if (whatsappImg && whatsappImg.complete && whatsappImg.naturalWidth > 0) {
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 1.5;
      ctx.shadowOffsetY = 1.5;
      ctx.drawImage(whatsappImg, iconX, iconY, iconSize, iconSize);
      ctx.restore();
    } else {
      drawFallbackWhatsAppIcon(ctx, iconX, iconY, iconSize);
    }

    ctx.restore();

    // Convert canvas to JPEG and trigger download
    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${planName.toLowerCase().replace(/\s+/g, "_")}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.warn("Watermarked download failed, falling back to direct download:", err);
    triggerFallbackDownload(imageUrl, planName);
  }
}

// Fallback architectural brand drawing for Oren Design & Build
function drawFallbackLogo(ctx: CanvasRenderingContext2D, rightX: number, centerY: number, bannerHeight: number) {
  ctx.save();
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  const logoText = "OREN";
  const subText = "DESIGN & BUILD";
  
  const fontSize1 = Math.max(14, Math.floor(bannerHeight * 0.22));
  const fontSize2 = Math.max(8, Math.floor(bannerHeight * 0.10));
  
  ctx.font = `bold tracking-widest ${fontSize1}px "Inter", sans-serif`;
  const textWidth1 = ctx.measureText(logoText).width;
  
  ctx.font = `600 tracking-widest ${fontSize2}px "Inter", sans-serif`;
  const textWidth2 = ctx.measureText(subText).width;
  
  const textWidth = Math.max(textWidth1, textWidth2);
  const iconSize = Math.max(16, Math.floor(bannerHeight * 0.25));
  const iconPadding = 10;
  const totalWidth = textWidth + iconPadding + iconSize;
  
  const startX = rightX - totalWidth;
  const iconCenterX = startX + iconSize / 2;
  const iconCenterY = centerY;
  
  ctx.strokeStyle = "#84e114";
  ctx.lineWidth = Math.max(2, Math.floor(bannerHeight * 0.02));
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  
  ctx.beginPath();
  ctx.moveTo(iconCenterX - iconSize / 2, iconCenterY + iconSize / 4);
  ctx.lineTo(iconCenterX, iconCenterY - iconSize / 2);
  ctx.lineTo(iconCenterX + iconSize / 2, iconCenterY + iconSize / 4);
  ctx.stroke();
  
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(iconCenterX, iconCenterY + iconSize / 8, Math.max(2, Math.floor(bannerHeight * 0.03)), 0, Math.PI * 2);
  ctx.fill();

  ctx.font = `bold ${fontSize1}px "Inter", sans-serif`;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(logoText, rightX, centerY - fontSize1 * 0.3);
  
  ctx.font = `600 ${fontSize2}px "Inter", sans-serif`;
  ctx.fillStyle = "#84e114";
  ctx.fillText(subText, rightX, centerY + fontSize1 * 0.6);
  
  ctx.restore();
}

function drawFallbackWhatsAppIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.fillStyle = "#25D366";
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.beginPath();
  ctx.moveTo(x + size * 0.35, y + size * 0.65);
  ctx.lineTo(x + size * 0.18, y + size * 0.82);
  ctx.lineTo(x + size * 0.3, y + size * 0.74);
  ctx.fillStyle = "#25D366";
  ctx.fill();

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = Math.max(1.5, size * 0.12);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.arc(x + size * 0.55, y + size * 0.45, size * 0.14, Math.PI * 0.8, Math.PI * 1.8);
  ctx.stroke();
  
  ctx.restore();
}

function triggerFallbackDownload(imageUrl: string, planName: string) {
  const link = document.createElement("a");
  link.href = imageUrl;
  link.target = "_blank";
  link.download = `${planName.toLowerCase().replace(/\s+/g, "_")}.jpg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
