// src/design/patternGenerator.js
class PatternGenerator {
  constructor() {
    this.enabled = true;
    console.log('🎨 PatternGenerator инициализирован');
  }

  generatePattern(ctx, width, height, options = {}) {
    // Быстрая проверка - если отключен, возвращаем пустой результат
    if (!this.enabled) {
      return { type: 'disabled', elements: 0 };
    }

    // Проверка валидности контекста
    if (!this.isValidContext(ctx)) {
      console.warn('⚠️ Недействительный Canvas контекст, пропускаем узоры');
      return { type: 'none', elements: 0 };
    }

    // Проверка параметров
    if (!width || !height || width <= 0 || height <= 0) {
      console.warn('⚠️ Некорректные размеры для узора:', { width, height });
      return { type: 'none', elements: 0 };
    }

    const {
      style = 'auto',
      intensity = 'subtle',
      brandColor = '#6366F1',
      slideType = 'default'
    } = options;

    console.log(`🎨 Генерация узора: ${style}, интенсивность: ${intensity}`);

    // Выбираем тип узора
    let patternType = style;
    if (style === 'auto') {
      patternType = this.selectAutoPattern(slideType);
    }

    // Генерируем узор с полной защитой
    try {
      // Сохраняем состояние контекста
      ctx.save();
      
      const result = this.renderPatternSafe(ctx, width, height, patternType, intensity, brandColor);
      
      // Восстанавливаем состояние
      ctx.restore();
      
      console.log(`✅ Узор создан: ${result.type} (${result.elements} элементов)`);
      return result;
      
    } catch (error) {
      console.error('❌ Ошибка генерации узора:', error.message);
      
      // Экстренное восстановление контекста
      try {
        ctx.restore();
      } catch (restoreError) {
        console.error('❌ Критическая ошибка восстановления контекста');
      }
      
      return { type: 'error', elements: 0, error: error.message };
    }
  }

  isValidContext(ctx) {
    try {
      return ctx && 
             typeof ctx.save === 'function' &&
             typeof ctx.restore === 'function' &&
             typeof ctx.fillRect === 'function' &&
             typeof ctx.beginPath === 'function' &&
             typeof ctx.arc === 'function' &&
             typeof ctx.fill === 'function';
    } catch (error) {
      return false;
    }
  }

  selectAutoPattern(slideType) {
    const patterns = {
      intro: 'subtle_dots',     // Убрал gradient_mesh как более безопасный
      text: 'subtle_dots', 
      quote: 'subtle_dots',
      default: 'subtle_dots'
    };
    return patterns[slideType] || patterns.default;
  }

  renderPatternSafe(ctx, width, height, patternType, intensity, brandColor) {
    const opacity = this.getOpacity(intensity);
    
    // Всегда используем простые точки для максимальной надежности
    switch (patternType) {
      case 'subtle_dots':
        return this.generateDotsSafe(ctx, width, height, brandColor, opacity);
      case 'gradient_mesh':
        // Fallback на точки вместо сложных градиентов
        return this.generateDotsSafe(ctx, width, height, brandColor, opacity);
      default:
        return this.generateDotsSafe(ctx, width, height, brandColor, opacity);
    }
  }

  generateDotsSafe(ctx, width, height, brandColor, opacity) {
    try {
      // Ограничиваем количество точек для производительности
      const maxDots = 100;
      const dotCount = Math.min(Math.floor((width * height) / 25000), maxDots);
      
      if (dotCount <= 0) {
        return { type: 'subtle_dots', elements: 0 };
      }

      const color = this.hexToRgbaSafe(brandColor, opacity);
      
      // Проверяем что можем установить цвет
      const originalFillStyle = ctx.fillStyle;
      ctx.fillStyle = color;
      
      let successfulDots = 0;
      
      for (let i = 0; i < dotCount; i++) {
        try {
          const x = Math.random() * width;
          const y = Math.random() * height;
          const radius = Math.random() * 2 + 0.5; // Меньшие точки
          
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
          successfulDots++;
          
        } catch (dotError) {
          // Пропускаем проблемную точку
          console.warn(`⚠️ Ошибка рисования точки ${i}:`, dotError.message);
        }
      }
      
      // Восстанавливаем исходный цвет
      ctx.fillStyle = originalFillStyle;
      
      return { 
        type: 'subtle_dots', 
        elements: successfulDots,
        requested: dotCount
      };
      
    } catch (error) {
      console.error('❌ Критическая ошибка в generateDotsSafe:', error.message);
      return { type: 'subtle_dots', elements: 0, error: error.message };
    }
  }

  getOpacity(intensity) {
    const opacities = {
      monochrome: 0.015,  // Еще более subtle
      subtle: 0.025,
      vibrant: 0.05,      // Снизил интенсивность
      gradient: 0.035
    };
    return opacities[intensity] || opacities.subtle;
  }

  hexToRgbaSafe(hex, alpha = 1) {
    try {
      // Дефолтный цвет если что-то пошло не так
      const defaultColor = `rgba(100, 102, 241, ${alpha})`;
      
      if (!hex || typeof hex !== 'string') {
        return defaultColor;
      }
      
      // Убираем # если есть
      const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;
      
      // Проверяем длину
      if (cleanHex.length !== 6) {
        return defaultColor;
      }
      
      const r = parseInt(cleanHex.slice(0, 2), 16);
      const g = parseInt(cleanHex.slice(2, 4), 16);
      const b = parseInt(cleanHex.slice(4, 6), 16);
      
      // Проверяем что парсинг успешен
      if (isNaN(r) || isNaN(g) || isNaN(b)) {
        return defaultColor;
      }
      
      // Ограничиваем значения
      const safeR = Math.max(0, Math.min(255, r));
      const safeG = Math.max(0, Math.min(255, g));
      const safeB = Math.max(0, Math.min(255, b));
      const safeAlpha = Math.max(0, Math.min(1, alpha));
      
      return `rgba(${safeR}, ${safeG}, ${safeB}, ${safeAlpha})`;
      
    } catch (error) {
      console.warn('⚠️ Ошибка конвертации цвета:', error.message);
      return `rgba(100, 102, 241, ${alpha})`;
    }
  }

  // Методы управления
  enable() {
    this.enabled = true;
    console.log('✅ PatternGenerator включен');
  }

  disable() {
    this.enabled = false;
    console.log('🔒 PatternGenerator отключен');
  }

  isEnabled() {
    return this.enabled;
  }

  // Безопасные заглушки для остальных методов
  generateMultiplePatterns(theme, count = 3) {
    if (!this.enabled) {
      return [];
    }
    
    const patterns = [];
    for (let i = 0; i < count; i++) {
      patterns.push({
        id: `pattern_${Date.now()}_${i}`,
        type: 'subtle_dots',
        theme: theme,
        safe: true
      });
    }
    return patterns;
  }

  getRecommendedPattern(contentAnalysis, theme) {
    return { 
      type: 'subtle_dots', 
      intensity: 'subtle',
      safe: true
    };
  }

  // Диагностический метод
  runDiagnostic(ctx, width = 100, height = 100) {
    console.log('\n🔍 === ДИАГНОСТИКА PATTERN GENERATOR ===');
    console.log('Включен:', this.enabled);
    console.log('Контекст валиден:', this.isValidContext(ctx));
    
    if (ctx && this.isValidContext(ctx)) {
      try {
        const testResult = this.generatePattern(ctx, width, height, {
          style: 'subtle_dots',
          intensity: 'subtle'
        });
        console.log('Тестовый результат:', testResult);
        return true;
      } catch (error) {
        console.error('❌ Диагностика провалена:', error.message);
        return false;
      }
    }
    
    return false;
  }
}

module.exports = PatternGenerator;
