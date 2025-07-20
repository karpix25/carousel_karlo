// src/design/themes/index.js

class DesignSystem {
  constructor() {
    this.themes = new Map();
    this.initializeThemes();
  }

  initializeThemes() {
    // Минималистичная тема
    this.themes.set('minimal', {
      name: 'Минимализм',
      description: 'Чистый и современный дизайн',
      typography: {
        primaryFont: 'Inter',
        secondaryFont: 'Inter',
        titleSizes: {
          h1: { size: 120, weight: 'bold', lineHeight: 1.1, letterSpacing: -0.02 },
          h2: { size: 84, weight: 'semibold', lineHeight: 1.2, letterSpacing: -0.01 },
          h3: { size: 64, weight: 'medium', lineHeight: 1.3, letterSpacing: 0 }
        },
        bodySizes: {
          large: { size: 56, weight: 'regular', lineHeight: 1.4, letterSpacing: 0 },
          medium: { size: 48, weight: 'regular', lineHeight: 1.5, letterSpacing: 0 },
          small: { size: 40, weight: 'regular', lineHeight: 1.6, letterSpacing: 0.01 }
        },
        quoteSizes: {
          large: { size: 72, weight: 'medium', lineHeight: 1.3, letterSpacing: 0 },
          small: { size: 56, weight: 'medium', lineHeight: 1.4, letterSpacing: 0 }
        }
      },
      colors: {
        primary: '#000000',
        secondary: '#666666', 
        accent: '#6366F1',
        background: '#FFFFFF',
        surface: '#F8F9FA',
        error: '#EF4444',
        success: '#10B981',
        warning: '#F59E0B'
      },
      spacing: {
        baseUnit: 8,
        scale: [0, 8, 16, 24, 32, 48, 64, 96, 128, 192],
        section: 80,
        paragraph: 24,
        line: 8
      },
      layout: {
        padding: 144,
        contentWidth: 1312, // 1600 - 144*2
        borderRadius: 64,
        maxContentRatio: 0.75 // Максимум 75% высоты для контента
      }
    });

    // Корпоративная тема
    this.themes.set('corporate', {
      name: 'Корпоративный',
      description: 'Профессиональный бизнес-стиль',
      typography: {
        primaryFont: 'Montserrat',
        secondaryFont: 'Roboto',
        titleSizes: {
          h1: { size: 112, weight: 'bold', lineHeight: 1.15, letterSpacing: -0.015 },
          h2: { size: 80, weight: 'bold', lineHeight: 1.25, letterSpacing: -0.01 },
          h3: { size: 60, weight: 'semibold', lineHeight: 1.3, letterSpacing: 0 }
        },
        bodySizes: {
          large: { size: 52, weight: 'regular', lineHeight: 1.45, letterSpacing: 0 },
          medium: { size: 44, weight: 'regular', lineHeight: 1.5, letterSpacing: 0 },
          small: { size: 36, weight: 'regular', lineHeight: 1.6, letterSpacing: 0.01 }
        },
        quoteSizes: {
          large: { size: 68, weight: 'semibold', lineHeight: 1.35, letterSpacing: 0 },
          small: { size: 52, weight: 'medium', lineHeight: 1.45, letterSpacing: 0 }
        }
      },
      colors: {
        primary: '#1E293B',
        secondary: '#64748B',
        accent: '#3B82F6', 
        background: '#FFFFFF',
        surface: '#F1F5F9',
        error: '#DC2626',
        success: '#059669',
        warning: '#D97706'
      },
      spacing: {
        baseUnit: 8,
        scale: [0, 8, 16, 24, 32, 48, 64, 80, 112, 160],
        section: 88,
        paragraph: 28,
        line: 12
      },
      layout: {
        padding: 160,
        contentWidth: 1280, // 1600 - 160*2
        borderRadius: 48,
        maxContentRatio: 0.8
      }
    });

    // Креативная тема
    this.themes.set('creative', {
      name: 'Креативный',
      description: 'Яркий и выразительный дизайн',
      typography: {
        primaryFont: 'Montserrat',
        secondaryFont: 'Inter',
        titleSizes: {
          h1: { size: 132, weight: 'black', lineHeight: 1.05, letterSpacing: -0.025 },
          h2: { size: 92, weight: 'bold', lineHeight: 1.15, letterSpacing: -0.015 },
          h3: { size: 68, weight: 'bold', lineHeight: 1.25, letterSpacing: -0.005 }
        },
        bodySizes: {
          large: { size: 60, weight: 'regular', lineHeight: 1.35, letterSpacing: 0 },
          medium: { size: 52, weight: 'regular', lineHeight: 1.4, letterSpacing: 0 },
          small: { size: 44, weight: 'regular', lineHeight: 1.5, letterSpacing: 0 }
        },
        quoteSizes: {
          large: { size: 84, weight: 'bold', lineHeight: 1.2, letterSpacing: -0.01 },
          small: { size: 64, weight: 'semibold', lineHeight: 1.3, letterSpacing: 0 }
        }
      },
      colors: {
        primary: '#0F172A',
        secondary: '#475569',
        accent: '#8B5CF6',
        background: '#FFFFFF',
        surface: '#F8FAFC',
        error: '#F87171',
        success: '#34D399',
        warning: '#FBBF24'
      },
      spacing: {
        baseUnit: 12,
        scale: [0, 12, 24, 36, 48, 72, 96, 144, 192, 288],
        section: 96,
        paragraph: 32,
        line: 16
      },
      layout: {
        padding: 128,
        contentWidth: 1344, // 1600 - 128*2
        borderRadius: 80,
        maxContentRatio: 0.7
      }
    });

    console.log(`🎨 Загружено тем дизайна: ${this.themes.size}`);
  }

  /**
   * Получение темы по имени
   */
  getTheme(themeName = 'minimal') {
    if (!this.themes.has(themeName)) {
      console.warn(`⚠️ Тема "${themeName}" не найдена, используем minimal`);
      themeName = 'minimal';
    }
    return this.themes.get(themeName);
  }

  /**
   * Получение всех доступных тем
   */
  getAvailableThemes() {
    const themes = {};
    for (const [key, theme] of this.themes) {
      themes[key] = {
        name: theme.name,
        description: theme.description,
        preview: {
          primaryFont: theme.typography.primaryFont,
          accentColor: theme.colors.accent,
          backgroundColor: theme.colors.background
        }
      };
    }
    return themes;
  }

  /**
   * Создание кастомной темы на основе существующей
   */
  createCustomTheme(baseTheme, overrides = {}) {
    const base = this.getTheme(baseTheme);
    const custom = this.deepMerge(base, overrides);
    return custom;
  }

  /**
   * Глубокое слияние объектов
   */
  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  /**
   * Адаптивное масштабирование темы под размер экрана
   */
  adaptThemeForSize(theme, canvasWidth, canvasHeight) {
    const baseWidth = 1600;
    const scale = canvasWidth / baseWidth;
    
    const adapted = JSON.parse(JSON.stringify(theme)); // Deep clone
    
    // Масштабируем типографику
    const scaleTypography = (sizes) => {
      for (const key in sizes) {
        if (sizes[key].size) {
          sizes[key].size = Math.round(sizes[key].size * scale);
        }
      }
    };

    scaleTypography(adapted.typography.titleSizes);
    scaleTypography(adapted.typography.bodySizes);
    scaleTypography(adapted.typography.quoteSizes);

    // Масштабируем отступы
    adapted.spacing.scale = adapted.spacing.scale.map(value => Math.round(value * scale));
    adapted.spacing.section = Math.round(adapted.spacing.section * scale);
    adapted.spacing.paragraph = Math.round(adapted.spacing.paragraph * scale);
    adapted.spacing.line = Math.round(adapted.spacing.line * scale);

    // Масштабируем layout
    adapted.layout.padding = Math.round(adapted.layout.padding * scale);
    adapted.layout.contentWidth = canvasWidth - (adapted.layout.padding * 2);
    adapted.layout.borderRadius = Math.round(adapted.layout.borderRadius * scale);

    return adapted;
  }

  /**
   * Анализ контрастности темы
   */
  analyzeContrast(theme) {
    const results = [];
    
    // Проверяем основные комбинации
    const combinations = [
      { fg: theme.colors.primary, bg: theme.colors.background, context: 'Основной текст' },
      { fg: theme.colors.secondary, bg: theme.colors.background, context: 'Вторичный текст' },
      { fg: theme.colors.background, bg: theme.colors.accent, context: 'Акцентный слайд' },
      { fg: theme.colors.primary, bg: theme.colors.surface, context: 'Текст на поверхности' }
    ];

    for (const combo of combinations) {
      const contrast = this.calculateContrast(combo.fg, combo.bg);
      const rating = this.getContrastRating(contrast);
      
      results.push({
        context: combo.context,
        contrast: contrast.toFixed(2),
        rating,
        accessible: contrast >= 4.5,
        foreground: combo.fg,
        background: combo.bg
      });
    }

    return results;
  }

  /**
   * Расчет контрастности между двумя цветами
   */
  calculateContrast(color1, color2) {
    const getLuminance = (color) => {
      const rgb = this.hexToRgb(color);
      const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
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
    } : null;
  }

  /**
   * Получение рейтинга контрастности
   */
  getContrastRating(contrast) {
    if (contrast >= 7) return 'AAA';
    if (contrast >= 4.5) return 'AA';
    if (contrast >= 3) return 'A';
    return 'Fail';
  }
}

module.exports = DesignSystem;
