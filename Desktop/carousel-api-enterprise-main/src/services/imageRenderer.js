// src/services/imageRenderer.js

const { createCanvas, loadImage } = require('canvas');
const PatternGenerator = require('../design/patternGenerator'); // Добавлено

class ImageRenderer {
  constructor(fontManager, designSystem, layoutEngine) {
    this.fontManager = fontManager;
    this.designSystem = designSystem;
    this.layoutEngine = layoutEngine;
    this.patternGenerator = new PatternGenerator(); // Добавлено
    this.canvasConfig = {
      width: 1600,
      height: 2000,
      format: 'png'
    };
  }

  /**
   * Рендеринг полной карусели
   */
  async renderCarousel(slides, settings = {}) {
    const {
      theme = 'minimal',
      canvasWidth = this.canvasConfig.width,
      canvasHeight = this.canvasConfig.height
    } = settings;

    // Получаем тему
    let selectedTheme = this.designSystem.getTheme(theme);
    
    // Адаптируем тему под размер
    selectedTheme = this.designSystem.adaptThemeForSize(selectedTheme, canvasWidth, canvasHeight);

    // Загружаем аватар если есть
    const avatarImage = settings.avatarUrl ? await this.loadAvatar(settings.avatarUrl) : null;

    const images = [];
    const slideMetadata = [];
    const qualityMetrics = {
      overallScore: 0,
      typographyScores: [],
      layoutScores: []
    };

    // Рендерим каждый слайд
    for (let i = 0; i < slides.length; i++) {
      try {
        const result = await this.renderSlide(
          slides[i], 
          i + 1, 
          slides.length, 
          selectedTheme, 
          settings,
          avatarImage
        );

        images.push(result.base64);
        slideMetadata.push(result.metadata);
        
        if (result.qualityScore !== undefined) {
          qualityMetrics.typographyScores.push(result.qualityScore);
        }

      } catch (slideError) {
        console.error(`❌ Ошибка рендеринга слайда ${i + 1}:`, slideError.message);
        
        // Создаем заглушку для проблемного слайда
        const errorImage = this.createErrorSlide(canvasWidth, canvasHeight, `Ошибка слайда ${i + 1}`);
        images.push(errorImage);
        slideMetadata.push({ error: slideError.message, slideNumber: i + 1 });
      }
    }

    // Рассчитываем общие метрики качества
    if (qualityMetrics.typographyScores.length > 0) {
      qualityMetrics.overallScore = qualityMetrics.typographyScores.reduce((a, b) => a + b, 0) / qualityMetrics.typographyScores.length;
    }

    return {
      images,
      slideMetadata,
      qualityMetrics
    };
  }

  /**
   * Рендеринг одного слайда
   */
  async renderSlide(slide, slideNumber, totalSlides, theme, settings, avatarImage = null) {
    const canvas = createCanvas(this.canvasConfig.width, this.canvasConfig.height);
    const ctx = canvas.getContext('2d');

    // Определяем цвета
    const isAccent = slide.color === 'accent';
    const bgColor = isAccent ? (settings.brandColor || theme.colors.accent) : theme.colors.background;
    const textColor = isAccent ? this.getContrastColor(bgColor) : theme.colors.primary;
    
    // Фон
    ctx.fillStyle = bgColor;
    if (theme.layout.borderRadius > 0) {
      this.drawRoundedRect(ctx, 0, 0, canvas.width, canvas.height, theme.layout.borderRadius);
      ctx.fill();
    } else {
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 🎨 НОВОЕ: Генерация узора
    if (settings.enablePatterns !== false) { // По умолчанию включено
      try {
        const patternOptions = {
          style: settings.patternStyle || 'auto',
          intensity: settings.patternIntensity || 'subtle',
          theme: settings.theme || 'minimal',
          brandColor: settings.brandColor || theme.colors.accent,
          slideType: slide.type,
          backgroundType: isAccent ? 'accent' : 'light'
        };

        const patternInfo = this.patternGenerator.generatePattern(
          ctx, 
          canvas.width, 
          canvas.height, 
          patternOptions
        );

        console.log(`🎨 Узор создан: ${patternInfo.type} (${patternInfo.elements} элементов)`);
      } catch (patternError) {
        console.warn('⚠️ Ошибка генерации узора:', patternError.message);
        // Продолжаем без узора
      }
    }

    // Компоновка слайда
    const layoutResult = this.layoutEngine.layoutSlide(
      ctx, 
      slide, 
      canvas.width, 
      canvas.height, 
      { theme, allowOverflow: false }
    );

    // Рендеринг header/footer
    this.renderHeaderFooter(
      ctx, 
      slideNumber, 
      totalSlides, 
      settings.authorUsername || '@username',
      settings.authorFullName || 'Your Name',
      theme,
      textColor,
      avatarImage
    );

    // Рендеринг контента
    this.layoutEngine.renderLayout(
      ctx, 
      layoutResult.layoutTree, 
      theme, 
      { primary: textColor, accent: settings.brandColor || theme.colors.accent }
    );

    // Debug режим
    if (settings.debug) {
      this.layoutEngine.renderDebugInfo(ctx, layoutResult.layoutTree, layoutResult.contentArea);
    }

    // Конвертация в base64
    const base64 = canvas.toBuffer('image/png').toString('base64');

    return {
      base64,
      metadata: {
        slideNumber,
        type: slide.type,
        layoutMetrics: layoutResult.metrics,
        validation: layoutResult.validation,
        patternUsed: settings.enablePatterns !== false // Добавлено для метрик
      },
      qualityScore: layoutResult.metrics?.overallScore
    };
  }

  /**
   * Рендеринг header и footer
   */
  renderHeaderFooter(ctx, slideNumber, totalSlides, username, fullName, theme, textColor, avatarImage) {
    const headerFont = theme.typography.bodySizes.small;
    const fontSize = Math.round(headerFont.size * 0.8); // Немного меньше для header/footer
    
    ctx.fillStyle = textColor;
    ctx.globalAlpha = 0.7;
    ctx.font = this.fontManager.getFontString(theme.typography.secondaryFont, headerFont.weight, fontSize);
    
    const headerY = theme.layout.padding;
    const footerY = this.canvasConfig.height - theme.layout.padding;
    
    // Header
    ctx.textAlign = 'left';
    if (avatarImage) {
      const avatarSize = fontSize * 1.8;
      const avatarY = headerY - avatarSize / 2 - 4;
      this.renderAvatar(ctx, avatarImage, theme.layout.padding, avatarY, avatarSize);
      ctx.fillText(username, theme.layout.padding + avatarSize + 16, headerY);
    } else {
      ctx.fillText(username, theme.layout.padding, headerY);
    }
    
    ctx.textAlign = 'right';
    ctx.fillText(`${slideNumber}/${totalSlides}`, this.canvasConfig.width - theme.layout.padding, headerY);
    
    // Footer
    ctx.textAlign = 'left';
    ctx.fillText(fullName, theme.layout.padding, footerY);
    
    ctx.textAlign = 'right';
    if (slideNumber < totalSlides) {
      ctx.fillText('→', this.canvasConfig.width - theme.layout.padding, footerY);
    }
    
    ctx.globalAlpha = 1;
  }

  /**
   * Загрузка аватарки
   */
  async loadAvatar(url) {
    try {
      return await loadImage(url);
    } catch (error) {
      console.warn('⚠️ Не удалось загрузить аватарку:', error.message);
      return null;
    }
  }

  /**
   * Рендеринг аватарки
   */
  renderAvatar(ctx, avatarImage, x, y, size) {
    if (!avatarImage) return;
    
    try {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(avatarImage, x, y, size, size);
      ctx.restore();
    } catch (error) {
      console.warn('⚠️ Ошибка рендеринга аватарки:', error.message);
      ctx.restore();
    }
  }

  /**
   * Определение контрастного цвета
   */
  getContrastColor(backgroundColor) {
    try {
      const rgb = this.hexToRgb(backgroundColor);
      const luminance = this.getLuminance(rgb.r, rgb.g, rgb.b);
      return luminance > 0.5 ? '#000000' : '#ffffff';
    } catch (error) {
      return '#000000';
    }
  }

  /**
   * Конвертация HEX в RGB
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  /**
   * Расчет яркости
   */
  getLuminance(r, g, b) {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  /**
   * Рисование скругленного прямоугольника
   */
  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  /**
   * Создание слайда с ошибкой
   */
  createErrorSlide(width, height, errorMessage) {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Фон
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, width, height);
    
    // Текст ошибки
    ctx.fillStyle = '#374151';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.fillText('⚠️ Ошибка рендеринга', width / 2, height / 2 - 30);
    ctx.font = '32px Arial';
    ctx.fillText(errorMessage, width / 2, height / 2 + 30);
    
    return canvas.toBuffer('image/png').toString('base64');
  }

  /**
   * 🎨 НОВОЕ: Тестирование узоров
   */
  async testPattern(patternType, theme, brandColor, intensity = 'subtle') {
    const canvas = createCanvas(800, 600);
    const ctx = canvas.getContext('2d');
    
    // Белый фон
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 800, 600);
    
    try {
      const patternInfo = this.patternGenerator.generatePattern(ctx, 800, 600, {
        style: patternType,
        intensity,
        theme,
        brandColor,
        slideType: 'test',
        backgroundType: 'light'
      });
      
      return {
        success: true,
        pattern: patternInfo,
        image: canvas.toBuffer('image/png').toString('base64')
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Получение статистики рендеринга
   */
  getStats() {
    return {
      canvasConfig: this.canvasConfig,
      supportedFormats: ['png', 'jpeg'],
      maxDimensions: {
        width: 4000,
        height: 6000
      },
      components: {
        fontManager: this.fontManager ? 'ready' : 'not initialized',
        designSystem: this.designSystem ? 'ready' : 'not initialized',
        layoutEngine: this.layoutEngine ? 'ready' : 'not initialized',
        patternGenerator: this.patternGenerator ? 'ready' : 'not initialized' // Добавлено
      },
      patterns: {
        enabled: true,
        availableTypes: ['subtle_dots', 'geometric_lines', 'organic_waves', 'particle_field', 'gradient_mesh', 'mandala'],
        availableIntensities: ['monochrome', 'subtle', 'vibrant', 'gradient']
      }
    };
  }

  /**
   * Установка конфигурации Canvas
   */
  setCanvasConfig(config) {
    this.canvasConfig = { ...this.canvasConfig, ...config };
  }

  /**
   * Пакетный рендеринг (для множественных каруселей)
   */
  async renderBatch(carousels, globalSettings = {}) {
    const results = [];
    
    for (let i = 0; i < carousels.length; i++) {
      const { slides, settings } = carousels[i];
      const mergedSettings = { ...globalSettings, ...settings };
      
      try {
        console.log(`🔄 Рендеринг карусели ${i + 1}/${carousels.length}`);
        const result = await this.renderCarousel(slides, mergedSettings);
        results.push({ success: true, data: result, index: i });
      } catch (error) {
        console.error(`❌ Ошибка рендеринга карусели ${i + 1}:`, error.message);
        results.push({ success: false, error: error.message, index: i });
      }
    }
    
    const successful = results.filter(r => r.success).length;
    console.log(`✅ Пакетный рендеринг завершен: ${successful}/${carousels.length} успешно`);
    
    return {
      results,
      summary: {
        total: carousels.length,
        successful,
        failed: carousels.length - successful,
        successRate: (successful / carousels.length) * 100
      }
    };
  }
}

module.exports = ImageRenderer;
