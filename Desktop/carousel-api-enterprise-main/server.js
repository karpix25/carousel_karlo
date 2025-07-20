// server.js - Entry Point для Carousel API

const express = require('express');
const path = require('path');

// Импорт наших модулей
const FontManager = require('./src/services/fontManager');
const DesignSystem = require('./src/design/themes/index');
const AdvancedTextProcessor = require('./src/typography/textProcessor');
const LayoutEngine = require('./src/typography/layoutEngine');
const { parseMarkdownToSlides, addFinalSlide } = require('./src/services/markdownParser');
const ImageRenderer = require('./src/services/imageRenderer');
const PatternGenerator = require('./src/design/patternGenerator'); // Добавлено
const config = require('./src/config/index');

console.log('🎨 Запуск Carousel API с продвинутой типографикой и узорами...');

class CarouselServer {
  constructor() {
    this.app = express();
    this.fontManager = null;
    this.designSystem = null;
    this.textProcessor = null;
    this.layoutEngine = null;
    this.imageRenderer = null;
    this.patternGenerator = null; // Добавлено
    
    this.initialize();
  }

  async initialize() {
    try {
      // Инициализация компонентов
      console.log('🔤 Инициализация FontManager...');
      this.fontManager = new FontManager();
      
      console.log('🎨 Инициализация DesignSystem...');
      this.designSystem = new DesignSystem();
      
      console.log('📝 Инициализация TextProcessor...');
      this.textProcessor = new AdvancedTextProcessor();
      
      console.log('🏗️ Инициализация LayoutEngine...');
      this.layoutEngine = new LayoutEngine(this.designSystem.getTheme(), this.fontManager);
      
      console.log('🎨 Инициализация PatternGenerator...');
      this.patternGenerator = new PatternGenerator();
      
      console.log('🖼️ Инициализация ImageRenderer...');
      this.imageRenderer = new ImageRenderer(this.fontManager, this.designSystem, this.layoutEngine);

      // Настройка Express
      this.setupMiddleware();
      this.setupRoutes();
      this.setupErrorHandling();

      console.log('✅ Все компоненты инициализированы');
      
    } catch (error) {
      console.error('❌ Ошибка инициализации:', error);
      process.exit(1);
    }
  }

  setupMiddleware() {
    // Базовые middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`📡 ${req.method} ${req.path} - ${new Date().toISOString()}`);
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      const fontStats = this.fontManager.getStats();
      const availableThemes = this.designSystem.getAvailableThemes();
      const rendererStats = this.imageRenderer.getStats();
      
      res.json({
        status: 'healthy',
        engine: 'carousel-api-enterprise-with-patterns',
        components: {
          fontManager: {
            status: 'ready',
            loadedFamilies: fontStats.loadedFamilies,
            totalVariants: fontStats.totalVariants
          },
          designSystem: {
            status: 'ready',
            availableThemes: Object.keys(availableThemes).length
          },
          textProcessor: { status: 'ready' },
          layoutEngine: { status: 'ready' },
          imageRenderer: { status: 'ready' },
          patternGenerator: { 
            status: 'ready',
            availablePatterns: rendererStats.patterns?.availableTypes?.length || 6
          }
        },
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // Получение доступных шрифтов
    this.app.get('/api/fonts', (req, res) => {
      try {
        const fonts = this.fontManager.getAvailableFonts();
        res.json({
          fonts,
          count: Object.keys(fonts).length
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Получение доступных тем
    this.app.get('/api/themes', (req, res) => {
      try {
        const themes = this.designSystem.getAvailableThemes();
        res.json({
          themes,
          count: Object.keys(themes).length
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // 🎨 НОВОЕ: Тестирование узоров
    this.app.post('/api/test-patterns', (req, res) => {
      try {
        const { 
          theme = 'minimal',
          brandColor = '#6366F1',
          patternType = 'auto',
          intensity = 'subtle'
        } = req.body;
        
        const { createCanvas } = require('canvas');
        
        // Создаем тестовый canvas
        const canvas = createCanvas(800, 600);
        const ctx = canvas.getContext('2d');
        
        // Фон
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 800, 600);
        
        // Генерируем узор
        const patternInfo = this.patternGenerator.generatePattern(ctx, 800, 600, {
          style: patternType,
          intensity,
          theme,
          brandColor,
          slideType: 'test',
          backgroundType: 'light'
        });
        
        // Конвертируем в base64
        const base64 = canvas.toBuffer('image/png').toString('base64');
        
        res.json({
          pattern: patternInfo,
          image: base64,
          settings: { theme, brandColor, patternType, intensity },
          preview: `data:image/png;base64,${base64}`
        });
        
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // 🎨 НОВОЕ: Получение вариантов узоров
    this.app.get('/api/patterns/:theme', (req, res) => {
      try {
        const { theme } = req.params;
        const patterns = this.patternGenerator.generateMultiplePatterns(theme, 5);
        
        res.json({
          theme,
          patterns,
          count: patterns.length,
          availableTypes: ['subtle_dots', 'geometric_lines', 'organic_waves', 'particle_field', 'gradient_mesh', 'mandala'],
          availableIntensities: ['monochrome', 'subtle', 'vibrant', 'gradient']
        });
        
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // 🎨 НОВОЕ: Получение всех доступных узоров
    this.app.get('/api/patterns', (req, res) => {
      try {
        const allPatterns = {
          minimal: this.patternGenerator.generateMultiplePatterns('minimal', 3),
          corporate: this.patternGenerator.generateMultiplePatterns('corporate', 3),
          creative: this.patternGenerator.generateMultiplePatterns('creative', 3)
        };
        
        res.json({
          patterns: allPatterns,
          totalCount: Object.values(allPatterns).flat().length,
          availableTypes: ['subtle_dots', 'geometric_lines', 'organic_waves', 'particle_field', 'gradient_mesh', 'mandala'],
          availableIntensities: ['monochrome', 'subtle', 'vibrant', 'gradient'],
          usage: {
            enablePatterns: true,
            patternStyle: 'auto|subtle_dots|geometric_lines|organic_waves|particle_field|gradient_mesh|mandala',
            patternIntensity: 'monochrome|subtle|vibrant|gradient'
          }
        });
        
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Анализ контрастности темы
    this.app.post('/api/analyze-contrast', (req, res) => {
      try {
        const { themeName, customColors } = req.body;
        
        let theme = this.designSystem.getTheme(themeName);
        if (customColors) {
          theme = this.designSystem.createCustomTheme(themeName, { colors: customColors });
        }
        
        const contrastResults = this.designSystem.analyzeContrast(theme);
        
        res.json({
          theme: theme.name,
          contrastAnalysis: contrastResults,
          overallAccessible: contrastResults.every(result => result.accessible)
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Предварительный просмотр (только анализ, без рендеринга)
    this.app.post('/api/preview', async (req, res) => {
      const startTime = Date.now();
      
      try {
        const { text, settings = {} } = req.body;
        
        // Валидация
        if (!text || typeof text !== 'string') {
          return res.status(400).json({ error: 'Требуется валидный text' });
        }

        // Парсинг слайдов
        let slides = parseMarkdownToSlides(text);
        slides = addFinalSlide(slides, settings);

        if (!slides.length) {
          slides = [{ type: 'text', title: 'Ваш контент', text: text.substring(0, 200), color: 'default' }];
        }

        // Анализ без рендеринга
        const analysis = slides.map(slide => {
          const contentAnalysis = this.layoutEngine.analyzeSlideContent ? 
            this.layoutEngine.analyzeSlideContent(slide) : 
            { complexity: 'unknown', estimatedElements: 1 };
          
          // Рекомендация узора для каждого слайда
          const recommendedPattern = this.patternGenerator.getRecommendedPattern(
            { complexity: contentAnalysis.complexity, type: slide.type, hasImages: false },
            settings.theme || 'minimal'
          );
          
          return {
            type: slide.type,
            title: slide.title ? slide.title.substring(0, 50) + '...' : null,
            contentLength: slide.text ? slide.text.length : 0,
            analysis: contentAnalysis,
            recommendedPattern: recommendedPattern
          };
        });

        const processingTime = Date.now() - startTime;

        res.json({
          slides: analysis,
          metadata: {
            totalSlides: slides.length,
            estimatedProcessingTime: slides.length * 800,
            analysisTime: processingTime,
            settings: settings,
            patternsEnabled: settings.enablePatterns !== false
          }
        });

      } catch (error) {
        console.error('❌ Ошибка preview:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Главный эндпоинт генерации карусели
    this.app.post('/api/generate-carousel', async (req, res) => {
      const startTime = Date.now();
      
      try {
        const { text, settings = {} } = req.body;
        
        // Валидация
        const validation = this.validateRequest(req.body);
        if (!validation.isValid) {
          return res.status(400).json({ 
            error: 'Ошибки валидации',
            details: validation.errors 
          });
        }

        console.log(`🎯 Генерация карусели (${text.length} символов, тема: ${settings.theme || 'minimal'}, узоры: ${settings.enablePatterns !== false ? 'включены' : 'отключены'})`);

        // Парсинг слайдов
        const parseStartTime = Date.now();
        let slides = parseMarkdownToSlides(text);
        slides = addFinalSlide(slides, settings);
        const parseTime = Date.now() - parseStartTime;

        if (!slides.length) {
          slides = [{ type: 'text', title: 'Ваш контент', text: text.substring(0, 200), color: 'default' }];
        }

        // Рендеринг
        const renderStartTime = Date.now();
        const result = await this.imageRenderer.renderCarousel(slides, settings);
        const renderTime = Date.now() - renderStartTime;

        const totalTime = Date.now() - startTime;

        console.log(`✅ Карусель готова за ${totalTime}ms (${slides.length} слайдов)`);

        res.json({
          slides: result.slideMetadata || slides,
          images: result.images,
          metadata: {
            totalSlides: slides.length,
            generatedAt: new Date().toISOString(),
            processingTime: totalTime,
            performance: {
              parsing: parseTime,
              rendering: renderTime,
              avgPerSlide: Math.round(renderTime / slides.length)
            },
            settings: {
              ...settings,
              patternsUsed: settings.enablePatterns !== false
            },
            engine: 'carousel-api-enterprise-with-patterns',
            quality: result.qualityMetrics || {}
          }
        });

      } catch (error) {
        const processingTime = Date.now() - startTime;
        console.error('❌ Ошибка генерации:', error);

        // Специфичные ошибки
        if (error.message?.includes('font')) {
          return res.status(400).json({
            error: 'Ошибка шрифта',
            message: 'Проблема с загрузкой или использованием шрифтов',
            details: error.message
          });
        }

        if (error.message?.includes('pattern')) {
          return res.status(400).json({
            error: 'Ошибка узора',
            message: 'Проблема с генерацией узора, карусель создана без узоров',
            details: error.message
          });
        }

        if (error.message?.includes('memory')) {
          return res.status(507).json({
            error: 'Недостаточно памяти',
            message: 'Попробуйте сократить объем контента или отключить узоры'
          });
        }

        res.status(500).json({
          error: 'Внутренняя ошибка сервера',
          message: process.env.NODE_ENV === 'development' ? error.message : 'Попробуйте позже',
          processingTime,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      }
    });

    // Тестовый эндпоинт для проверки типографики
    this.app.post('/api/test-typography', (req, res) => {
      try {
        const { text, theme = 'minimal' } = req.body;
        
        const selectedTheme = this.designSystem.getTheme(theme);
        const canvas = require('canvas').createCanvas(1600, 2000);
        const ctx = canvas.getContext('2d');
        
        // Устанавливаем шрифт
        const fontString = this.fontManager.getFontString(
          selectedTheme.typography.primaryFont,
          'regular',
          selectedTheme.typography.bodySizes.large.size
        );
        ctx.font = fontString;
        
        // Тестируем переносы
        const result = this.textProcessor.optimizeLineBreaks(ctx, text, 1200, {
          preventHanging: true,
          hyphenationQuality: 'high'
        });

        res.json({
          originalText: text,
          wrappedLines: result.lines,
          metrics: result.metrics,
          optimized: result.optimized,
          theme: theme,
          font: fontString
        });

      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  setupErrorHandling() {
    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Эндпоинт не найден',
        availableEndpoints: [
          'GET /health',
          'GET /api/fonts',
          'GET /api/themes', 
          'GET /api/patterns',
          'GET /api/patterns/:theme',
          'POST /api/preview',
          'POST /api/generate-carousel',
          'POST /api/analyze-contrast',
          'POST /api/test-typography',
          'POST /api/test-patterns'
        ]
      });
    });

    // Global error handler
    this.app.use((error, req, res, next) => {
      console.error('💥 Необработанная ошибка:', error);
      
      res.status(500).json({
        error: 'Критическая ошибка сервера',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Внутренняя ошибка',
        timestamp: new Date().toISOString()
      });
    });
  }

  validateRequest(body) {
    const errors = [];
    
    if (!body.text || typeof body.text !== 'string') {
      errors.push('text обязателен и должен быть строкой');
    }
    
    if (body.text && body.text.length > 50000) {
      errors.push('text слишком длинный (макс 50k символов)');
    }
    
    if (body.settings?.theme && !this.designSystem.getAvailableThemes()[body.settings.theme]) {
      errors.push(`Неизвестная тема: ${body.settings.theme}`);
    }
    
    if (body.settings?.primaryFont && !this.fontManager.isFontAvailable(body.settings.primaryFont)) {
      errors.push(`Шрифт недоступен: ${body.settings.primaryFont}`);
    }

    // Валидация настроек узоров
    if (body.settings?.patternStyle) {
      const validPatterns = ['auto', 'subtle_dots', 'geometric_lines', 'organic_waves', 'particle_field', 'gradient_mesh', 'mandala'];
      if (!validPatterns.includes(body.settings.patternStyle)) {
        errors.push(`Неизвестный тип узора: ${body.settings.patternStyle}`);
      }
    }

    if (body.settings?.patternIntensity) {
      const validIntensities = ['monochrome', 'subtle', 'vibrant', 'gradient'];
      if (!validIntensities.includes(body.settings.patternIntensity)) {
        errors.push(`Неизвестная интенсивность узора: ${body.settings.patternIntensity}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  start(port = process.env.PORT || 3001) {
    const server = this.app.listen(port, () => {
      console.log('\n🚀 Carousel API запущен!');
      console.log(`📡 Порт: ${port}`);
      console.log(`🌐 Health: http://localhost:${port}/health`);
      console.log(`📚 API: http://localhost:${port}/api/`);
      console.log(`🎨 Готов к созданию красивых каруселей с узорами!\n`);
      
      // Печатаем статистику
      const fontStats = this.fontManager.getStats();
      const themes = this.designSystem.getAvailableThemes();
      const rendererStats = this.imageRenderer.getStats();
      
      console.log('📊 Компоненты:');
      console.log(`   🔤 Шрифтов: ${fontStats.loadedFamilies} семейств, ${fontStats.totalVariants} вариантов`);
      console.log(`   🎨 Тем: ${Object.keys(themes).length}`);
      console.log(`   🖼️ Узоров: ${rendererStats.patterns?.availableTypes?.length || 6} типов`);
      console.log(`   📝 Типографика: продвинутая обработка`);
      console.log(`   🏗️ Layout: автоматическая компоновка\n`);
    });

    // Graceful shutdown
    const gracefulShutdown = () => {
      console.log('\n🛑 Получен сигнал завершения...');
      
      server.close(() => {
        console.log('✅ HTTP сервер закрыт');
        
        // Очистка ресурсов
        if (this.fontManager) {
          this.fontManager.clearCache();
          console.log('🧹 Кэш шрифтов очищен');
        }
        
        console.log('👋 Graceful shutdown завершен');
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    return server;
  }
}

// Запуск сервера
if (require.main === module) {
  const server = new CarouselServer();
  server.start();
}

module.exports = CarouselServer;
