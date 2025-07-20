// src/config/index.js

const path = require('path');

const config = {
  // Основные настройки
  app: {
    name: 'Carousel API',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3001
  },

  // Canvas настройки
  canvas: {
    defaultWidth: parseInt(process.env.CANVAS_WIDTH) || 1600,
    defaultHeight: parseInt(process.env.CANVAS_HEIGHT) || 2000,
    maxWidth: parseInt(process.env.CANVAS_MAX_WIDTH) || 4000,
    maxHeight: parseInt(process.env.CANVAS_MAX_HEIGHT) || 6000,
    defaultFormat: process.env.CANVAS_FORMAT || 'png',
    borderRadius: parseInt(process.env.CANVAS_BORDER_RADIUS) || 64
  },

  // Пути к ресурсам
  paths: {
    fonts: path.join(process.cwd(), 'assets', 'fonts'),
    uploads: path.join(process.cwd(), 'uploads'),
    temp: path.join(process.cwd(), 'temp'),
    logs: path.join(process.cwd(), 'logs')
  },

  // Лимиты и ограничения
  limits: {
    maxTextLength: parseInt(process.env.MAX_TEXT_LENGTH) || 50000,
    maxSlides: parseInt(process.env.MAX_SLIDES) || 20,
    maxRequestSize: process.env.MAX_REQUEST_SIZE || '10mb',
    processingTimeout: parseInt(process.env.PROCESSING_TIMEOUT) || 30000, // 30 секунд
    maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS) || 10
  },

  // Настройки шрифтов
  fonts: {
    defaultFamily: process.env.DEFAULT_FONT_FAMILY || 'Inter',
    fallbackFamilies: ['Arial', 'sans-serif'],
    minSize: parseInt(process.env.MIN_FONT_SIZE) || 24,
    maxSize: parseInt(process.env.MAX_FONT_SIZE) || 200,
    cacheSize: parseInt(process.env.FONT_CACHE_SIZE) || 1000
  },

  // Настройки типографики
  typography: {
    defaultLineHeight: parseFloat(process.env.DEFAULT_LINE_HEIGHT) || 1.4,
    defaultLetterSpacing: parseFloat(process.env.DEFAULT_LETTER_SPACING) || 0,
    hangingWordsPrevention: process.env.HANGING_WORDS_PREVENTION !== 'false',
    hyphenationQuality: process.env.HYPHENATION_QUALITY || 'high',
    optimizeLineBreaks: process.env.OPTIMIZE_LINE_BREAKS !== 'false'
  },

  // Настройки дизайна
  design: {
    defaultTheme: process.env.DEFAULT_THEME || 'minimal',
    defaultBrandColor: process.env.DEFAULT_BRAND_COLOR || '#6366F1',
    contrastThreshold: parseFloat(process.env.CONTRAST_THRESHOLD) || 4.5,
    adaptiveSpacing: process.env.ADAPTIVE_SPACING !== 'false',
    responsiveTypography: process.env.RESPONSIVE_TYPOGRAPHY !== 'false'
  },

  // Производительность
  performance: {
    enableCaching: process.env.ENABLE_CACHING !== 'false',
    cacheTimeout: parseInt(process.env.CACHE_TIMEOUT) || 3600000, // 1 час
    enableCompression: process.env.ENABLE_COMPRESSION !== 'false',
    enableProfiling: process.env.ENABLE_PROFILING === 'true',
    memoryThreshold: parseInt(process.env.MEMORY_THRESHOLD) || 512 // МБ
  },

  // Логирование
  logging: {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING !== 'false',
    enableErrorTracking: process.env.ENABLE_ERROR_TRACKING !== 'false',
    logToFile: process.env.LOG_TO_FILE === 'true',
    maxLogFiles: parseInt(process.env.MAX_LOG_FILES) || 5,
    maxLogSize: process.env.MAX_LOG_SIZE || '10MB'
  },

  // CORS настройки
  cors: {
    enabled: process.env.CORS_ENABLED !== 'false',
    origins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['*'],
    methods: process.env.CORS_METHODS ? process.env.CORS_METHODS.split(',') : ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: process.env.CORS_HEADERS ? process.env.CORS_HEADERS.split(',') : ['Content-Type', 'Authorization']
  },

  // Настройки безопасности
  security: {
    enableRateLimit: process.env.ENABLE_RATE_LIMIT !== 'false',
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000, // 15 минут
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    enableInputSanitization: process.env.ENABLE_INPUT_SANITIZATION !== 'false',
    enableContentValidation: process.env.ENABLE_CONTENT_VALIDATION !== 'false'
  },

  // Внешние сервисы
  external: {
    allowExternalImages: process.env.ALLOW_EXTERNAL_IMAGES !== 'false',
    imageTimeout: parseInt(process.env.IMAGE_TIMEOUT) || 5000,
    maxImageSize: parseInt(process.env.MAX_IMAGE_SIZE) || 5242880, // 5MB
    allowedImageDomains: process.env.ALLOWED_IMAGE_DOMAINS ? process.env.ALLOWED_IMAGE_DOMAINS.split(',') : []
  },

  // Мониторинг и здоровье
  monitoring: {
    enableHealthCheck: process.env.ENABLE_HEALTH_CHECK !== 'false',
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 60000, // 1 минута
    enableMetrics: process.env.ENABLE_METRICS === 'true',
    metricsPath: process.env.METRICS_PATH || '/metrics'
  }
};

/**
 * Валидация конфигурации
 */
function validateConfig() {
  const errors = [];

  // Проверка обязательных путей
  if (!config.paths.fonts) {
    errors.push('Путь к шрифтам не установлен');
  }

  // Проверка лимитов
  if (config.limits.maxTextLength <= 0) {
    errors.push('maxTextLength должен быть больше 0');
  }

  if (config.limits.maxSlides <= 0) {
    errors.push('maxSlides должен быть больше 0');
  }

  // Проверка Canvas размеров
  if (config.canvas.defaultWidth <= 0 || config.canvas.defaultHeight <= 0) {
    errors.push('Размеры Canvas должны быть больше 0');
  }

  // Проверка шрифтов
  if (!config.fonts.defaultFamily) {
    errors.push('Не установлено семейство шрифтов по умолчанию');
  }

  if (errors.length > 0) {
    console.error('❌ Ошибки конфигурации:');
    errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }

  console.log('✅ Конфигурация валидна');
}

/**
 * Получение конфигурации для компонента
 */
function getComponentConfig(component) {
  const componentConfigs = {
    canvas: config.canvas,
    fonts: config.fonts,
    typography: config.typography,
    design: config.design,
    performance: config.performance,
    security: config.security
  };

  return componentConfigs[component] || null;
}

/**
 * Обновление конфигурации в runtime
 */
function updateConfig(path, value) {
  const keys = path.split('.');
  let current = config;
  
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  
  current[keys[keys.length - 1]] = value;
  console.log(`⚙️ Конфигурация обновлена: ${path} = ${value}`);
}

/**
 * Получение всей конфигурации
 */
function getConfig() {
  return config;
}

/**
 * Получение информации об окружении
 */
function getEnvironmentInfo() {
  return {
    nodeVersion: process.version,
    platform: process.platform,
    architecture: process.arch,
    environment: config.app.environment,
    isDevelopment: config.app.environment === 'development',
    isProduction: config.app.environment === 'production',
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime()
  };
}

/**
 * Печать конфигурации в консоль (для отладки)
 */
function printConfig() {
  if (config.app.environment === 'development') {
    console.log('\n📋 Текущая конфигурация:');
    console.log('═'.repeat(50));
    
    console.log(`🚀 Приложение: ${config.app.name} v${config.app.version}`);
    console.log(`🌍 Окружение: ${config.app.environment}`);
    console.log(`📡 Порт: ${config.app.port}`);
    console.log(`🖼️ Canvas: ${config.canvas.defaultWidth}×${config.canvas.defaultHeight}`);
    console.log(`🔤 Шрифт: ${config.fonts.defaultFamily}`);
    console.log(`🎨 Тема: ${config.design.defaultTheme}`);
    console.log(`📝 Макс. текст: ${config.limits.maxTextLength} символов`);
    console.log(`📄 Макс. слайдов: ${config.limits.maxSlides}`);
    
    if (config.performance.enableCaching) {
      console.log(`💾 Кэширование: включено (${config.performance.cacheTimeout}ms)`);
    }
    
    if (config.security.enableRateLimit) {
      console.log(`🛡️ Rate Limit: ${config.security.rateLimitMax} запросов/${config.security.rateLimitWindow}ms`);
    }
    
    console.log('═'.repeat(50));
  }
}

// Валидируем конфигурацию при загрузке модуля
if (require.main !== module) {
  validateConfig();
}

module.exports = {
  config,
  validateConfig,
  getComponentConfig,
  updateConfig,
  getConfig,
  getEnvironmentInfo,
  printConfig
};
