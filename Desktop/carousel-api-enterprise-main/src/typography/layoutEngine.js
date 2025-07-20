// src/typography/layoutEngine.js

class LayoutEngine {
    constructor(theme, fontManager) {
      this.theme = theme;
      this.fontManager = fontManager;
      this.debugMode = false;
    }
  
    /**
     * Главная функция компоновки слайда
     */
    layoutSlide(ctx, slide, canvasWidth, canvasHeight, options = {}) {
      const {
        theme = this.theme,
        maxContentRatio = theme.layout.maxContentRatio,
        verticalAlign = 'center', // top, center, bottom
        horizontalAlign = 'left',  // left, center, right
        allowOverflow = false,
        optimizeSpacing = true
      } = options;
  
      // Расчет области контента
      const contentArea = this.calculateContentArea(canvasWidth, canvasHeight, theme);
      
      // Анализ контента
      const contentAnalysis = this.analyzeSlideContent(slide);
      
      // Выбор оптимальной стратегии компоновки
      const strategy = this.selectLayoutStrategy(contentAnalysis, contentArea);
      
      // Создание layout tree
      const layoutTree = this.createLayoutTree(slide, strategy, theme);
      
      // Измерение элементов
      this.measureElements(ctx, layoutTree, contentArea);
      
      // Оптимизация размеров
      if (optimizeSpacing) {
        this.optimizeLayout(layoutTree, contentArea, allowOverflow);
      }
      
      // Позиционирование элементов
      this.positionElements(layoutTree, contentArea, verticalAlign, horizontalAlign);
      
      // Финальная проверка
      const validation = this.validateLayout(layoutTree, contentArea);
      
      return {
        layoutTree,
        contentArea,
        strategy,
        validation,
        metrics: this.calculateLayoutMetrics(layoutTree, contentArea)
      };
    }
  
    /**
     * Расчет области контента
     */
    calculateContentArea(canvasWidth, canvasHeight, theme) {
      const padding = theme.layout.padding;
      const headerHeight = theme.typography.bodySizes.small.size * 2; // Примерная высота header
      const footerHeight = headerHeight;
      
      return {
        x: padding,
        y: padding + headerHeight,
        width: canvasWidth - (padding * 2),
        height: canvasHeight - (padding * 2) - headerHeight - footerHeight,
        centerX: canvasWidth / 2,
        centerY: (canvasHeight - headerHeight - footerHeight) / 2 + headerHeight + padding
      };
    }
  
    /**
     * Анализ контента слайда
     */
    analyzeSlideContent(slide) {
      const analysis = {
        type: slide.type,
        hasTitle: Boolean(slide.title),
        hasText: Boolean(slide.text),
        titleLength: slide.title ? slide.title.length : 0,
        textLength: slide.text ? slide.text.length : 0,
        complexity: 'low',
        estimatedElements: 0,
        contentRatio: 0
      };
  
      // Подсчет элементов
      if (analysis.hasTitle) analysis.estimatedElements++;
      if (analysis.hasText) {
        const paragraphs = slide.text.split('\n\n').length;
        const lists = (slide.text.match(/•/g) || []).length;
        analysis.estimatedElements += paragraphs + lists;
      }
  
      // Определение сложности
      const totalLength = analysis.titleLength + analysis.textLength;
      if (totalLength > 500 || analysis.estimatedElements > 5) {
        analysis.complexity = 'high';
      } else if (totalLength > 200 || analysis.estimatedElements > 3) {
        analysis.complexity = 'medium';
      }
  
      // Приблизительное соотношение контента
      analysis.contentRatio = Math.min(1, totalLength / 800);
  
      return analysis;
    }
  
    /**
     * Выбор стратегии компоновки
     */
    selectLayoutStrategy(analysis, contentArea) {
      const strategies = {
        intro: 'centered-hero',
        quote: 'centered-quote',
        text: analysis.complexity === 'high' ? 'compact-flow' : 'generous-flow'
      };
  
      const baseStrategy = strategies[analysis.type] || 'generous-flow';
  
      return {
        name: baseStrategy,
        spacingMode: analysis.complexity === 'high' ? 'tight' : 'normal',
        fontScaling: true,
        adaptiveSpacing: true,
        verticalCentering: analysis.type === 'intro' || analysis.type === 'quote'
      };
    }
  
    /**
     * Создание дерева компоновки
     */
    createLayoutTree(slide, strategy, theme) {
      const tree = {
        type: 'container',
        children: [],
        style: {
          direction: 'vertical',
          spacing: strategy.spacingMode === 'tight' ? theme.spacing.paragraph : theme.spacing.section
        }
      };
  
      // Добавляем заголовок
      if (slide.title) {
        const titleElement = this.createTitleElement(slide.title, slide.type, theme);
        tree.children.push(titleElement);
      }
  
      // Добавляем контент
      if (slide.text) {
        const contentElements = this.createContentElements(slide.text, slide.type, theme);
        tree.children.push(...contentElements);
      }
  
      return tree;
    }
  
    /**
     * Создание элемента заголовка
     */
    createTitleElement(title, slideType, theme) {
      const sizeMap = {
        intro: 'h1',
        text: 'h2', 
        quote: 'h2'
      };
  
      const size = sizeMap[slideType] || 'h2';
      const typography = theme.typography.titleSizes[size];
  
      return {
        type: 'title',
        content: title,
        style: {
          font: theme.typography.primaryFont,
          size: typography.size,
          weight: typography.weight,
          lineHeight: typography.lineHeight,
          letterSpacing: typography.letterSpacing,
          color: 'primary',
          align: slideType === 'intro' ? 'left' : 'left'
        },
        measured: {},
        position: {}
      };
    }
  
    /**
     * Создание элементов контента
     */
    createContentElements(text, slideType, theme) {
      const elements = [];
      const paragraphs = text.split('\n\n').filter(p => p.trim());
  
      for (const paragraph of paragraphs) {
        if (paragraph.trim().startsWith('•')) {
          // Список
          const listElement = this.createListElement(paragraph, theme);
          elements.push(listElement);
        } else {
          // Обычный параграф
          const paragraphElement = this.createParagraphElement(paragraph, theme);
          elements.push(paragraphElement);
        }
      }
  
      return elements;
    }
  
    /**
     * Создание элемента списка
     */
    createListElement(listText, theme) {
      const items = listText.split('\n').map(line => line.replace(/^•\s*/, '').trim()).filter(Boolean);
      
      return {
        type: 'list',
        items: items,
        style: {
          font: theme.typography.secondaryFont,
          size: theme.typography.bodySizes.large.size,
          weight: theme.typography.bodySizes.large.weight,
          lineHeight: theme.typography.bodySizes.large.lineHeight,
          letterSpacing: theme.typography.bodySizes.large.letterSpacing,
          color: 'primary',
          bulletStyle: '→',
          indent: 48
        },
        measured: {},
        position: {}
      };
    }
  
    /**
     * Создание элемента параграфа
     */
    createParagraphElement(text, theme) {
      return {
        type: 'paragraph',
        content: text,
        style: {
          font: theme.typography.secondaryFont,
          size: theme.typography.bodySizes.large.size,
          weight: theme.typography.bodySizes.large.weight,
          lineHeight: theme.typography.bodySizes.large.lineHeight,
          letterSpacing: theme.typography.bodySizes.large.letterSpacing,
          color: 'primary',
          align: 'left'
        },
        measured: {},
        position: {}
      };
    }
  
    /**
     * Измерение элементов
     */
    measureElements(ctx, layoutTree, contentArea) {
      this.traverseTree(layoutTree, (element) => {
        if (element.type === 'container') return;
  
        // Устанавливаем шрифт
        const fontString = this.fontManager.getFontString(
          element.style.font,
          element.style.weight,
          element.style.size
        );
        ctx.font = fontString;
  
        // Измеряем в зависимости от типа
        switch (element.type) {
          case 'title':
          case 'paragraph':
            this.measureTextElement(ctx, element, contentArea.width);
            break;
          case 'list':
            this.measureListElement(ctx, element, contentArea.width);
            break;
        }
      });
    }
  
    /**
     * Измерение текстового элемента
     */
    measureTextElement(ctx, element, maxWidth) {
      const AdvancedTextProcessor = require('./textProcessor');
      const processor = new AdvancedTextProcessor();
      
      const result = processor.optimizeLineBreaks(ctx, element.content, maxWidth, {
        preventHanging: true,
        hyphenationQuality: 'high'
      });
  
      element.measured = {
        lines: result.lines,
        lineCount: result.lines.length,
        width: Math.max(...result.lines.map(line => ctx.measureText(line).width)),
        height: result.lines.length * Math.round(element.style.size * element.style.lineHeight),
        metrics: result.metrics
      };
    }
  
    /**
     * Измерение элемента списка
     */
    measureListElement(ctx, element, maxWidth) {
      const AdvancedTextProcessor = require('./textProcessor');
      const processor = new AdvancedTextProcessor();
      
      const measuredItems = [];
      let totalHeight = 0;
      let maxWidth_actual = 0;
  
      for (const item of element.items) {
        const bulletWidth = ctx.measureText(element.style.bulletStyle + ' ').width;
        const availableWidth = maxWidth - element.style.indent - bulletWidth;
        
        const result = processor.optimizeLineBreaks(ctx, item, availableWidth);
        
        const itemHeight = result.lines.length * Math.round(element.style.size * element.style.lineHeight);
        
        measuredItems.push({
          text: item,
          lines: result.lines,
          height: itemHeight,
          width: Math.max(...result.lines.map(line => ctx.measureText(line).width))
        });
  
        totalHeight += itemHeight;
        maxWidth_actual = Math.max(maxWidth_actual, bulletWidth + element.style.indent + measuredItems[measuredItems.length - 1].width);
      }
  
      element.measured = {
        items: measuredItems,
        itemCount: element.items.length,
        width: maxWidth_actual,
        height: totalHeight + (element.items.length - 1) * element.style.size * 0.3, // Добавляем отступы между пунктами
        totalLines: measuredItems.reduce((sum, item) => sum + item.lines.length, 0)
      };
    }
  
    /**
     * Оптимизация компоновки
     */
    optimizeLayout(layoutTree, contentArea, allowOverflow) {
      // Рассчитываем общую высоту
      const totalHeight = this.calculateTotalHeight(layoutTree);
      
      if (totalHeight > contentArea.height && !allowOverflow) {
        // Применяем стратегии сжатия
        this.applyCompressionStrategies(layoutTree, contentArea, totalHeight);
      }
    }
  
    /**
     * Расчет общей высоты
     */
    calculateTotalHeight(layoutTree) {
      let totalHeight = 0;
      
      this.traverseTree(layoutTree, (element) => {
        if (element.measured && element.measured.height) {
          totalHeight += element.measured.height;
        }
      });
  
      // Добавляем отступы между элементами
      const elementCount = this.countElements(layoutTree);
      if (elementCount > 1) {
        totalHeight += (elementCount - 1) * layoutTree.style.spacing;
      }
  
      return totalHeight;
    }
  
    /**
     * Применение стратегий сжатия
     */
    applyCompressionStrategies(layoutTree, contentArea, currentHeight) {
      const compressionRatio = contentArea.height / currentHeight;
      
      console.log(`📐 Применяем сжатие: ${(compressionRatio * 100).toFixed(1)}%`);
  
      // Стратегия 1: Уменьшение отступов
      if (compressionRatio > 0.85) {
        layoutTree.style.spacing = Math.round(layoutTree.style.spacing * 0.7);
        return;
      }
  
      // Стратегия 2: Масштабирование шрифтов
      if (compressionRatio > 0.7) {
        const fontScale = Math.max(0.8, compressionRatio * 1.1);
        this.scaleTypography(layoutTree, fontScale);
        return;
      }
  
      // Стратегия 3: Агрессивное сжатие
      layoutTree.style.spacing = Math.round(layoutTree.style.spacing * 0.5);
      this.scaleTypography(layoutTree, Math.max(0.75, compressionRatio * 1.2));
    }
  
    /**
     * Масштабирование типографики
     */
    scaleTypography(layoutTree, scale) {
      this.traverseTree(layoutTree, (element) => {
        if (element.style && element.style.size) {
          element.style.size = Math.round(element.style.size * scale);
          // Пересчитываем высоту строки
          if (element.measured) {
            element.measured.height = Math.round(element.measured.height * scale);
          }
        }
      });
    }
  
    /**
     * Позиционирование элементов
     */
    positionElements(layoutTree, contentArea, verticalAlign, horizontalAlign) {
      const totalHeight = this.calculateTotalHeight(layoutTree);
      
      // Начальная позиция Y
      let startY;
      switch (verticalAlign) {
        case 'top':
          startY = contentArea.y;
          break;
        case 'bottom':
          startY = contentArea.y + contentArea.height - totalHeight;
          break;
        case 'center':
        default:
          startY = contentArea.y + (contentArea.height - totalHeight) / 2;
          break;
      }
  
      let currentY = startY;
  
      // Позиционируем каждый элемент
      this.traverseTree(layoutTree, (element) => {
        if (element.type === 'container') return;
  
        // X позиция в зависимости от выравнивания
        let x;
        switch (horizontalAlign) {
          case 'center':
            x = contentArea.x + (contentArea.width - element.measured.width) / 2;
            break;
          case 'right':
            x = contentArea.x + contentArea.width - element.measured.width;
            break;
          case 'left':
          default:
            x = contentArea.x;
            break;
        }
  
        element.position = {
          x: x,
          y: currentY,
          width: element.measured.width,
          height: element.measured.height
        };
  
        currentY += element.measured.height + layoutTree.style.spacing;
      });
    }
  
    /**
     * Валидация компоновки
     */
    validateLayout(layoutTree, contentArea) {
      const issues = [];
      const warnings = [];
  
      this.traverseTree(layoutTree, (element) => {
        if (!element.position) return;
  
        // Проверка выхода за границы
        if (element.position.x < contentArea.x || 
            element.position.x + element.position.width > contentArea.x + contentArea.width) {
          issues.push(`Элемент ${element.type} выходит за горизонтальные границы`);
        }
  
        if (element.position.y < contentArea.y || 
            element.position.y + element.position.height > contentArea.y + contentArea.height) {
          issues.push(`Элемент ${element.type} выходит за вертикальные границы`);
        }

        // Проверка читаемости
        if (element.style && element.style.size < 32) {
          warnings.push(`Шрифт элемента ${element.type} может быть слишком мелким (${element.style.size}px)`);
        }

        // Проверка метрик типографики
        if (element.measured && element.measured.metrics) {
          if (element.measured.metrics.readabilityScore < 60) {
            warnings.push(`Низкая читаемость элемента ${element.type} (${element.measured.metrics.readabilityScore})`);
          }
        }
      });

      return {
        isValid: issues.length === 0,
        issues,
        warnings,
        score: Math.max(0, 100 - issues.length * 20 - warnings.length * 5)
      };
    }

    /**
     * Расчет метрик компоновки
     */
    calculateLayoutMetrics(layoutTree, contentArea) {
      const metrics = {
        contentDensity: 0,
        verticalEfficiency: 0,
        typographyConsistency: 0,
        spacingRhythm: 0,
        overallScore: 0
      };

      const totalContentHeight = this.calculateTotalHeight(layoutTree);
      metrics.contentDensity = Math.min(100, (totalContentHeight / contentArea.height) * 100);
      
      // Эффективность использования пространства
      metrics.verticalEfficiency = Math.min(100, (totalContentHeight / contentArea.height) * 120);
      
      // Согласованность типографики
      const fontSizes = [];
      this.traverseTree(layoutTree, (element) => {
        if (element.style && element.style.size) {
          fontSizes.push(element.style.size);
        }
      });
      
      const baseSize = Math.min(...fontSizes);
      const consistentSizes = fontSizes.filter(size => size % (baseSize / 4) === 0);
      metrics.typographyConsistency = (consistentSizes.length / fontSizes.length) * 100;

      // Ритм отступов
      const spacings = [layoutTree.style.spacing];
      const baseUnit = 8;
      const rhythmicSpacings = spacings.filter(spacing => spacing % baseUnit === 0);
      metrics.spacingRhythm = (rhythmicSpacings.length / spacings.length) * 100;

      // Общий скор
      metrics.overallScore = (
        metrics.contentDensity * 0.3 +
        metrics.verticalEfficiency * 0.3 +
        metrics.typographyConsistency * 0.2 +
        metrics.spacingRhythm * 0.2
      );

      return metrics;
    }

    /**
     * Обход дерева элементов
     */
    traverseTree(node, callback) {
      callback(node);
      
      if (node.children) {
        for (const child of node.children) {
          this.traverseTree(child, callback);
        }
      }
    }

    /**
     * Подсчет элементов в дереве
     */
    countElements(node) {
      let count = node.type !== 'container' ? 1 : 0;
      
      if (node.children) {
        for (const child of node.children) {
          count += this.countElements(child);
        }
      }
      
      return count;
    }

    /**
     * Рендеринг компоновки на Canvas
     */
    renderLayout(ctx, layoutTree, theme, colors) {
      this.traverseTree(layoutTree, (element) => {
        if (element.type === 'container' || !element.position) return;

        const { x, y } = element.position;
        const color = colors[element.style.color] || colors.primary;
        
        ctx.fillStyle = color;
        ctx.textBaseline = 'top';

        switch (element.type) {
          case 'title':
          case 'paragraph':
            this.renderTextElement(ctx, element, x, y);
            break;
          case 'list':
            this.renderListElement(ctx, element, x, y, color);
            break;
        }
      });
    }

    /**
     * Рендеринг текстового элемента
     */
    renderTextElement(ctx, element, x, y) {
      const fontString = this.fontManager.getFontString(
        element.style.font,
        element.style.weight,
        element.style.size
      );
      ctx.font = fontString;

      const lineHeight = Math.round(element.style.size * element.style.lineHeight);
      let currentY = y;

      for (const line of element.measured.lines) {
        ctx.fillText(line, x, currentY);
        currentY += lineHeight;
      }
    }

    /**
     * Рендеринг элемента списка
     */
    renderListElement(ctx, element, x, y, color) {
      const fontString = this.fontManager.getFontString(
        element.style.font,
        element.style.weight,
        element.style.size
      );
      ctx.font = fontString;

      const lineHeight = Math.round(element.style.size * element.style.lineHeight);
      const bulletWidth = ctx.measureText(element.style.bulletStyle + ' ').width;
      let currentY = y;

      for (const item of element.measured.items) {
        // Рендерим маркер
        ctx.fillStyle = color;
        ctx.fillText(element.style.bulletStyle, x, currentY);
        
        // Рендерим текст пункта
        const textX = x + bulletWidth + element.style.indent;
        for (const line of item.lines) {
          ctx.fillText(line, textX, currentY);
          currentY += lineHeight;
        }
        
        // Отступ между пунктами
        currentY += element.style.size * 0.3;
      }
    }

    /**
     * Включение/выключение режима отладки
     */
    setDebugMode(enabled) {
      this.debugMode = enabled;
    }

    /**
     * Рендеринг отладочной информации
     */
    renderDebugInfo(ctx, layoutTree, contentArea) {
      if (!this.debugMode) return;

      ctx.save();
      
      // Границы области контента
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 2;
      ctx.strokeRect(contentArea.x, contentArea.y, contentArea.width, contentArea.height);
      
      // Границы элементов
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 1;
      
      this.traverseTree(layoutTree, (element) => {
        if (element.position) {
          ctx.strokeRect(
            element.position.x,
            element.position.y,
            element.position.width,
            element.position.height
          );
        }
      });
      
      ctx.restore();
    }
}

module.exports = LayoutEngine;
