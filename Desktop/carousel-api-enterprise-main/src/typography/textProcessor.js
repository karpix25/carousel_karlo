// src/typography/textProcessor.js

class AdvancedTextProcessor {
    constructor() {
      // Висячие предлоги и союзы (расширенный список)
      this.hangingWords = new Set([
        // Предлоги
        'в', 'на', 'за', 'под', 'над', 'при', 'про', 'для', 'без', 'через', 'между',
        'из', 'от', 'до', 'с', 'у', 'о', 'об', 'во', 'со', 'ко', 'по', 'к',
        
        // Союзы
        'и', 'а', 'но', 'да', 'или', 'либо', 'то', 'не', 'ни', 'же', 'ли',
        'что', 'как', 'где', 'когда', 'если', 'чтобы', 'который', 'которая', 'которое',
        
        // Частицы
        'бы', 'же', 'ли', 'разве', 'неужели', 'ведь', 'уж', 'вон', 'вот',
        
        // Короткие слова (до 3 символов)
        'он', 'она', 'оно', 'они', 'мы', 'вы', 'я', 'ты', 'их', 'им', 'ей', 'ему',
        'уже', 'еще', 'все', 'всё', 'так', 'тот', 'эта', 'это', 'эти'
      ]);
  
      // Нежелательные переносы
      this.noBreakAfter = new Set([
        'г.', 'гг.', 'р.', 'руб.', 'коп.', 'см.', 'м.', 'км.', 'кг.', 'т.',
        'млн.', 'млрд.', 'тыс.', 'шт.', '%', '№', '§',
        'т.д.', 'т.п.', 'т.е.', 'т.к.', 'и.о.', 'п.п.'
      ]);
  
      // Математические операторы и специальные символы
      this.mathOperators = new Set(['+', '−', '×', '÷', '=', '≠', '≤', '≥', '<', '>']);
    }
  
    /**
     * Основная функция переноса текста с продвинутой типографикой
     */
    wrapText(ctx, text, maxWidth, options = {}) {
      const {
        preserveSpaces = true,
        preventHanging = true, 
        preventMathBreaks = true,
        preventAbbreviationBreaks = true,
        hyphenationQuality = 'high' // low, medium, high
      } = options;
  
      if (!text) return [];
  
      // Предобработка текста
      const processedText = this.preprocessText(text, options);
      
      // Разбиваем на абзацы
      const paragraphs = processedText.split('\n').filter(p => p.trim());
      const allLines = [];
  
      for (const paragraph of paragraphs) {
        const paragraphLines = this.wrapParagraph(ctx, paragraph, maxWidth, options);
        allLines.push(...paragraphLines);
        
        // Добавляем пустую строку между абзацами если это не последний
        if (paragraph !== paragraphs[paragraphs.length - 1]) {
          allLines.push('');
        }
      }
  
      return allLines;
    }
  
    /**
     * Предобработка текста
     */
    preprocessText(text, options) {
      let processed = text;
  
      // Нормализация пробелов
      processed = processed.replace(/\s+/g, ' ');
      
      // Типографские кавычки
      processed = processed.replace(/"/g, '"').replace(/"/g, '"');
      processed = processed.replace(/'/g, "'").replace(/'/g, "'");
      
      // Длинное тире
      processed = processed.replace(/--/g, '—');
      processed = processed.replace(/\s-\s/g, ' — ');
      
      // Неразрывные пробелы после предлогов (опционально)
      if (options.useNonBreakingSpaces) {
        for (const word of this.hangingWords) {
          const regex = new RegExp(`\\b${word}\\s+`, 'gi');
          processed = processed.replace(regex, `${word}\u00A0`);
        }
      }
  
      return processed;
    }
  
    /**
     * Перенос одного абзаца
     */
    wrapParagraph(ctx, paragraph, maxWidth, options) {
      const words = this.tokenize(paragraph);
      const lines = [];
      let currentLine = [];
      let currentWidth = 0;
  
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const nextWord = words[i + 1];
        
        // Измеряем ширину слова
        const wordWidth = ctx.measureText(word.text).width;
        const spaceWidth = ctx.measureText(' ').width;
        
        // Проверяем, помещается ли слово
        const totalWidth = currentWidth + (currentLine.length > 0 ? spaceWidth : 0) + wordWidth;
        
        if (totalWidth <= maxWidth) {
          // Слово помещается
          currentLine.push(word);
          currentWidth = totalWidth;
          
          // Проверяем правила висячих предлогов
          if (options.preventHanging && nextWord && this.shouldPreventHanging(word, nextWord, ctx, maxWidth - currentWidth)) {
            // Принудительно переносим следующее слово тоже
            if (i + 1 < words.length) {
              const nextWordWidth = ctx.measureText(nextWord.text).width;
              if (currentWidth + spaceWidth + nextWordWidth <= maxWidth) {
                i++; // Пропускаем следующую итерацию
                currentLine.push(nextWord);
                currentWidth += spaceWidth + nextWordWidth;
              }
            }
          }
        } else {
          // Слово не помещается
          if (currentLine.length > 0) {
            // Завершаем текущую строку
            lines.push(this.joinTokens(currentLine));
            currentLine = [];
            currentWidth = 0;
          }
          
          // Обрабатываем очень длинные слова
          if (wordWidth > maxWidth) {
            const brokenWords = this.breakLongWord(ctx, word.text, maxWidth, options);
            for (let j = 0; j < brokenWords.length; j++) {
              if (j === brokenWords.length - 1) {
                // Последняя часть остается для следующей строки
                currentLine.push({ text: brokenWords[j], type: 'word' });
                currentWidth = ctx.measureText(brokenWords[j]).width;
              } else {
                // Предыдущие части образуют отдельные строки
                lines.push(brokenWords[j]);
              }
            }
          } else {
            // Обычное слово начинает новую строку
            currentLine.push(word);
            currentWidth = wordWidth;
          }
        }
      }
  
      // Добавляем последнюю строку
      if (currentLine.length > 0) {
        lines.push(this.joinTokens(currentLine));
      }
  
      return lines;
    }
  
    /**
     * Токенизация текста (разбивка на слова с сохранением типов)
     */
    tokenize(text) {
      const tokens = [];
      const regex = /(\S+)/g;
      let match;
  
      while ((match = regex.exec(text)) !== null) {
        const word = match[1];
        const type = this.getTokenType(word);
        tokens.push({ text: word, type });
      }
  
      return tokens;
    }
  
    /**
     * Определение типа токена
     */
    getTokenType(token) {
      if (/^\d+/.test(token)) return 'number';
      if (this.mathOperators.has(token)) return 'operator';
      if (this.noBreakAfter.has(token.toLowerCase())) return 'abbreviation';
      if (this.hangingWords.has(token.toLowerCase())) return 'hanging';
      if (/[.!?]$/.test(token)) return 'sentence_end';
      return 'word';
    }
  
    /**
     * Проверка необходимости предотвращения висячего предлога
     */
    shouldPreventHanging(currentWord, nextWord, ctx, remainingWidth) {
      if (currentWord.type !== 'hanging') return false;
      
      const nextWordWidth = ctx.measureText(nextWord.text).width;
      const spaceWidth = ctx.measureText(' ').width;
      
      // Если следующее слово помещается, переносим его вместе с предлогом
      return (spaceWidth + nextWordWidth) <= remainingWidth;
    }
  
    /**
     * Разбивка длинных слов
     */
    breakLongWord(ctx, word, maxWidth, options) {
      const parts = [];
      let currentPart = '';
      
      for (let i = 0; i < word.length; i++) {
        const char = word[i];
        const testPart = currentPart + char;
        const testWidth = ctx.measureText(testPart).width;
        
        if (testWidth <= maxWidth - ctx.measureText('-').width) {
          currentPart = testPart;
        } else {
          if (currentPart) {
            parts.push(currentPart + '-');
            currentPart = char;
          } else {
            // Даже один символ не помещается - принудительно добавляем
            parts.push(char);
            currentPart = '';
          }
        }
      }
      
      if (currentPart) {
        parts.push(currentPart);
      }
      
      return parts;
    }
  
    /**
     * Соединение токенов обратно в строку
     */
    joinTokens(tokens) {
      return tokens.map(token => token.text).join(' ');
    }
  
    /**
     * Расчет качественных метрик типографики
     */
    calculateTypographyMetrics(lines, ctx) {
      const metrics = {
        lineCount: lines.length,
        avgLineLength: 0,
        lineVariation: 0,
        hangingWordsCount: 0,
        hyphenatedWordsCount: 0,
        readabilityScore: 0
      };
  
      if (lines.length === 0) return metrics;
  
      // Средняя длина строки
      const lineLengths = lines.map(line => ctx.measureText(line).width);
      metrics.avgLineLength = lineLengths.reduce((a, b) => a + b, 0) / lineLengths.length;
  
      // Вариация длин строк (чем меньше, тем лучше)
      const variance = lineLengths.reduce((sum, length) => {
        return sum + Math.pow(length - metrics.avgLineLength, 2);
      }, 0) / lineLengths.length;
      metrics.lineVariation = Math.sqrt(variance);
  
      // Подсчет висячих предлогов
      lines.forEach(line => {
        const words = line.split(' ');
        const lastWord = words[words.length - 1]?.toLowerCase();
        if (lastWord && this.hangingWords.has(lastWord)) {
          metrics.hangingWordsCount++;
        }
      });
  
      // Подсчет переносов
      metrics.hyphenatedWordsCount = lines.filter(line => line.endsWith('-')).length;
  
      // Простой скор читаемости (0-100, больше = лучше)
      const avgWordsPerLine = lines.reduce((sum, line) => sum + line.split(' ').length, 0) / lines.length;
      const idealWordsPerLine = 8; // Оптимально для слайдов
      const wordsScore = Math.max(0, 100 - Math.abs(avgWordsPerLine - idealWordsPerLine) * 10);
      
      const hangingPenalty = metrics.hangingWordsCount * 15;
      const variationPenalty = Math.min(metrics.lineVariation / 10, 30);
      
      metrics.readabilityScore = Math.max(0, wordsScore - hangingPenalty - variationPenalty);
  
      return metrics;
    }
  
    /**
     * Оптимизация переносов (итеративное улучшение)
     */
    optimizeLineBreaks(ctx, text, maxWidth, options = {}) {
      const { maxIterations = 3, targetReadability = 80 } = options;
      
      let bestResult = this.wrapText(ctx, text, maxWidth, options);
      let bestMetrics = this.calculateTypographyMetrics(bestResult, ctx);
      
      // Пробуем разные настройки для улучшения качества
      const variations = [
        { ...options, preventHanging: true },
        { ...options, preventHanging: false },
        { ...options, hyphenationQuality: 'medium' },
        { ...options, useNonBreakingSpaces: true }
      ];
  
      for (let i = 0; i < maxIterations && bestMetrics.readabilityScore < targetReadability; i++) {
        for (const variation of variations) {
          const result = this.wrapText(ctx, text, maxWidth, variation);
          const metrics = this.calculateTypographyMetrics(result, ctx);
          
          if (metrics.readabilityScore > bestMetrics.readabilityScore) {
            bestResult = result;
            bestMetrics = metrics;
          }
        }
      }
  
      return {
        lines: bestResult,
        metrics: bestMetrics,
        optimized: bestMetrics.readabilityScore >= targetReadability
      };
    }
  }
  
  module.exports = AdvancedTextProcessor;
