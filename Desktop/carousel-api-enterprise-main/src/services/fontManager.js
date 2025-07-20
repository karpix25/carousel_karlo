// src/services/fontManager.js
const { registerFont } = require('canvas');
const path = require('path');
const fs = require('fs');

class FontManager {
  constructor() {
    this.loadedFonts = new Map();
    this.fontCache = new Map();
    this.fontsPath = path.join(__dirname, '../../assets/fonts');
    this.registrationComplete = false;
    this.initializeFonts();
  }

  /**
   * Инициализация и регистрация TTF шрифтов
   */
  initializeFonts() {
    console.log('🔤 Загружаем TTF шрифты из:', this.fontsPath);
    
    try {
      // Проверяем что папка с шрифтами существует
      if (!fs.existsSync(this.fontsPath)) {
        console.error('❌ Папка шрифтов не найдена:', this.fontsPath);
        this.initializeFallbackFonts();
        return;
      }

      let totalRegistered = 0;

      // Регистрируем Inter
      totalRegistered += this.registerFontFamily('Inter', {
        light: 'Inter-Light.ttf',
        regular: 'Inter-Regular.ttf', 
        medium: 'Inter-Medium.ttf',
        semibold: 'Inter-SemiBold.ttf',
        bold: 'Inter-Bold.ttf',
        black: 'Inter-Black.ttf'
      });

      // Регистрируем Montserrat
      totalRegistered += this.registerFontFamily('Montserrat', {
        light: 'Montserrat-Light.ttf',
        regular: 'Montserrat-Regular.ttf',
        medium: 'Montserrat-Medium.ttf', 
        semibold: 'Montserrat-SemiBold.ttf',
        bold: 'Montserrat-Bold.ttf',
        black: 'Montserrat-Black.ttf'
      });

      // Регистрируем Roboto
      totalRegistered += this.registerFontFamily('Roboto', {
        light: 'Roboto-Light.ttf',
        regular: 'Roboto-Regular.ttf',
        medium: 'Roboto-Medium.ttf',
        bold: 'Roboto-Bold.ttf', 
        black: 'Roboto-Black.ttf'
      });

      if (totalRegistered > 0) {
        console.log(`✅ Зарегистрировано ${totalRegistered} шрифтов в ${this.loadedFonts.size} семействах`);
        this.registrationComplete = true;
      } else {
        console.warn('⚠️ Ни один шрифт не зарегистрирован, используем fallback');
        this.initializeFallbackFonts();
      }
      
    } catch (error) {
      console.error('❌ Критическая ошибка загрузки шрифтов:', error.message);
      this.initializeFallbackFonts();
    }
  }

  /**
   * Регистрация семейства шрифтов
   */
  registerFontFamily(familyName, variants) {
    const familyPath = path.join(this.fontsPath, familyName);
    const registeredVariants = {};
    let registeredCount = 0;

    console.log(`📝 Регистрируем семейство: ${familyName}`);

    if (!fs.existsSync(familyPath)) {
      console.warn(`  ⚠️ Папка ${familyName} не найдена:`, familyPath);
      return 0;
    }

    for (const [weight, filename] of Object.entries(variants)) {
      const fontPath = path.join(familyPath, filename);
      
      if (fs.existsSync(fontPath)) {
        try {
          // Проверяем размер файла
          const stats = fs.statSync(fontPath);
          if (stats.size === 0) {
            console.warn(`  ⚠️ Файл пуст: ${filename}`);
            continue;
          }

          // Регистрируем шрифт в Canvas
          registerFont(fontPath, { 
            family: familyName,
            weight: this.getCanvasWeight(weight)
          });
          
          registeredVariants[weight] = {
            path: fontPath,
            canvasWeight: this.getCanvasWeight(weight),
            registered: true,
            fileSize: stats.size
          };
          
          registeredCount++;
          console.log(`  ✅ ${familyName} ${weight} → ${this.getCanvasWeight(weight)}`);
          
        } catch (error) {
          console.error(`  ❌ Ошибка регистрации ${familyName} ${weight}:`, error.message);
          registeredVariants[weight] = {
            path: fontPath,
            canvasWeight: this.getCanvasWeight(weight),
            registered: false,
            error: error.message
          };
        }
      } else {
        console.warn(`  ⚠️ Файл не найден: ${filename}`);
      }
    }

    if (registeredCount > 0) {
      this.loadedFonts.set(familyName, {
        name: familyName,
        variants: registeredVariants,
        registeredCount
      });
      console.log(`  📊 ${familyName}: ${registeredCount}/${Object.keys(variants).length} вариантов`);
    }

    return registeredCount;
  }

  /**
   * Fallback на системные шрифты если TTF не загрузились
   */
  initializeFallbackFonts() {
    console.log('🔄 Инициализация системных шрифтов...');
    
    const systemFonts = {
      'Inter': 'system-ui, -apple-system, BlinkMacSystemFont, Arial',
      'Montserrat': 'Arial, sans-serif',
      'Roboto': 'Arial, sans-serif'
    };

    for (const [familyName, fallbackName] of Object.entries(systemFonts)) {
      this.loadedFonts.set(familyName, {
        name: fallbackName,
        variants: {
          light: { canvasWeight: '300', registered: false, fallback: true },
          regular: { canvasWeight: '400', registered: false, fallback: true },
          medium: { canvasWeight: '500', registered: false, fallback: true },
          semibold: { canvasWeight: '600', registered: false, fallback: true },
          bold: { canvasWeight: '700', registered: false, fallback: true },
          black: { canvasWeight: '900', registered: false, fallback: true }
        },
        registeredCount: 0,
        fallback: true
      });
    }

    this.registrationComplete = true;
    console.log('✅ Системные шрифты настроены');
  }

  /**
   * Получение CSS строки шрифта
   */
  getFontString(family, weight, size) {
    const key = `${family}-${weight}-${size}`;
    
    if (this.fontCache.has(key)) {
      return this.fontCache.get(key);
    }

    const fontData = this.loadedFonts.get(family);
    if (!fontData) {
      console.warn(`⚠️ Шрифт ${family} не найден, используем Arial`);
      const fontString = `${this.getCanvasWeight(weight)} ${size}px Arial, sans-serif`;
      this.fontCache.set(key, fontString);
      return fontString;
    }

    const variant = fontData.variants[weight] || fontData.variants['regular'];
    const canvasWeight = variant ? variant.canvasWeight : this.getCanvasWeight(weight);
    
    // Формируем строку шрифта с fallback
    let fontString;
    if (fontData.fallback) {
      fontString = `${canvasWeight} ${size}px ${fontData.name}`;
    } else {
      fontString = `${canvasWeight} ${size}px "${family}", Arial, sans-serif`;
    }
    
    this.fontCache.set(key, fontString);
    return fontString;
  }

  /**
   * Преобразование веса шрифта в формат Canvas
   */
  getCanvasWeight(weight) {
    const weightMap = {
      'thin': '100',
      'extralight': '200',
      'light': '300',
      'regular': '400', 
      'normal': '400',
      'medium': '500',
      'semibold': '600',
      'bold': '700',
      'extrabold': '800',
      'black': '900',
      'heavy': '900'
    };
    return weightMap[weight?.toLowerCase()] || '400';
  }

  /**
   * Проверка готовности шрифтов
   */
  isReady() {
    return this.registrationComplete;
  }

  /**
   * Ожидание готовности шрифтов
   */
  async waitForReady(timeout = 5000) {
    const start = Date.now();
    while (!this.registrationComplete && (Date.now() - start) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return this.registrationComplete;
  }

  /**
   * Подробная проверка загруженных шрифтов
   */
  validateFonts() {
    console.log('\n🔍 === ПРОВЕРКА ЗАГРУЖЕННЫХ ШРИФТОВ ===');
    
    for (const [familyName, family] of this.loadedFonts) {
      const status = family.fallback ? '🔄 FALLBACK' : '✅ TTF';
      console.log(`\n${status} ${familyName}:`);
      console.log(`  Canvas имя: "${family.name}"`);
      console.log(`  Зарегистрировано: ${family.registeredCount || 0} вариантов`);
      
      for (const [weight, variant] of Object.entries(family.variants)) {
        const regStatus = variant.registered ? '✅' : (variant.fallback ? '🔄' : '❌');
        const sizeInfo = variant.fileSize ? ` (${Math.round(variant.fileSize/1024)}KB)` : '';
        console.log(`    ${regStatus} ${weight} → ${variant.canvasWeight}${sizeInfo}`);
        
        if (variant.error) {
          console.log(`      ⚠️ ${variant.error}`);
        }
      }
    }
    
    console.log('\n📊 === ИТОГО ===');
    const totalFamilies = this.loadedFonts.size;
    const ttfFamilies = Array.from(this.loadedFonts.values()).filter(f => !f.fallback).length;
    const totalVariants = Array.from(this.loadedFonts.values())
      .reduce((sum, f) => sum + (f.registeredCount || 0), 0);
    
    console.log(`Семейств шрифтов: ${totalFamilies} (TTF: ${ttfFamilies}, Fallback: ${totalFamilies - ttfFamilies})`);
    console.log(`Зарегистрированных вариантов: ${totalVariants}`);
    console.log(`Кэш строк: ${this.fontCache.size}`);
    console.log(`Готовность: ${this.registrationComplete ? '✅' : '❌'}`);
  }

  /**
   * Получение доступных шрифтов
   */
  getAvailableFonts() {
    const fonts = {};
    for (const [familyName, family] of this.loadedFonts) {
      fonts[familyName] = {
        name: family.name,
        weights: Object.keys(family.variants),
        registered: family.registeredCount > 0,
        fallback: family.fallback || false,
        variants: family.registeredCount || 0
      };
    }
    return fonts;
  }

  /**
   * Проверка доступности шрифта
   */
  isFontAvailable(family, weight = 'regular') {
    const familyData = this.loadedFonts.get(family);
    if (!familyData) return false;
    
    const variant = familyData.variants[weight];
    return variant && (variant.registered || variant.fallback);
  }

  /**
   * Получение оптимального веса шрифта
   */
  getOptimalWeight(family, requestedWeight) {
    const familyData = this.loadedFonts.get(family);
    if (!familyData) return 'regular';

    // Если точное совпадение
    if (familyData.variants[requestedWeight]) {
      return requestedWeight;
    }

    // Fallback мапинг
    const fallbackMap = {
      'thin': ['light', 'regular'],
      'extralight': ['light', 'regular'], 
      'light': ['regular', 'medium'],
      'regular': ['medium', 'light'],
      'medium': ['semibold', 'regular'],
      'semibold': ['bold', 'medium'],
      'bold': ['black', 'semibold'],
      'extrabold': ['black', 'bold'],
      'black': ['bold', 'extrabold'],
      'heavy': ['black', 'bold']
    };

    const fallbacks = fallbackMap[requestedWeight] || ['regular'];
    for (const fallback of fallbacks) {
      if (familyData.variants[fallback]) {
        return fallback;
      }
    }

    // Последний шанс - любой доступный вариант
    const availableWeights = Object.keys(familyData.variants);
    return availableWeights[0] || 'regular';
  }

  /**
   * Тестирование рендеринга шрифта
   */
  testFontRendering(family, weight = 'regular', size = 16) {
    try {
      const fontString = this.getFontString(family, weight, size);
      console.log(`🧪 Тест: ${family} ${weight} ${size}px → "${fontString}"`);
      return true;
    } catch (error) {
      console.error(`❌ Ошибка теста ${family} ${weight}:`, error.message);
      return false;
    }
  }

  /**
   * Получение статистики
   */
  getStats() {
    const totalVariants = Array.from(this.loadedFonts.values())
      .reduce((sum, family) => sum + Object.keys(family.variants).length, 0);
    
    const registeredVariants = Array.from(this.loadedFonts.values())
      .reduce((sum, family) => sum + (family.registeredCount || 0), 0);

    const fallbackFamilies = Array.from(this.loadedFonts.values())
      .filter(f => f.fallback).length;

    return {
      ready: this.registrationComplete,
      loadedFamilies: this.loadedFonts.size,
      ttfFamilies: this.loadedFonts.size - fallbackFamilies,
      fallbackFamilies,
      totalVariants,
      registeredVariants,
      cacheSize: this.fontCache.size,
      fontsPath: this.fontsPath,
      availableFonts: this.getAvailableFonts()
    };
  }

  /**
   * Очистка кэша шрифтов
   */
  clearCache() {
    this.fontCache.clear();
    console.log('🧹 Кэш шрифтов очищен');
  }

  /**
   * Принудительная перезагрузка шрифтов
   */
  reload() {
    console.log('🔄 Перезагрузка шрифтов...');
    this.loadedFonts.clear();
    this.clearCache();
    this.registrationComplete = false;
    this.initializeFonts();
  }
}

module.exports = FontManager;
