// src/services/markdownParser.js

const { marked } = require('marked');

/**
 * Парсинг Markdown в слайды
 */
function parseMarkdownToSlides(text) {
  const tokens = marked.lexer(text);
  const slides = [];
  let currentSlide = null;

  tokens.forEach((token, index) => {
    if (token.type === 'heading' && token.depth === 1) {
      const nextToken = tokens[index + 1];
      const subtitle = (nextToken && nextToken.type === 'paragraph') ? nextToken.text : '';
      
      slides.push({
        type: 'intro',
        title: token.text,
        text: subtitle,
        color: 'accent'
      });
    } else if (token.type === 'heading' && token.depth === 2) {
      currentSlide = {
        type: 'text',
        title: token.text,
        text: '',
        color: 'default',
        content: []
      };
      slides.push(currentSlide);
    } else if (token.type === 'blockquote') {
      const quoteText = token.tokens?.[0]?.text || '';
      slides.push({
        type: 'quote',
        text: quoteText,
        color: 'accent',
        size: quoteText.length > 100 ? 'small' : 'large'
      });
    } else if (currentSlide && (token.type === 'paragraph' || token.type === 'list')) {
      if (token.type === 'paragraph') {
        currentSlide.content.push({ type: 'paragraph', text: token.text });
      } else if (token.type === 'list') {
        currentSlide.content.push({
          type: 'list',
          items: token.items.map(item => item.text)
        });
      }
    }
  });

  // Объединяем контент
  slides.forEach(slide => {
    if (slide.content) {
      const paragraphs = slide.content.filter(c => c.type === 'paragraph').map(c => c.text);
      const lists = slide.content.filter(c => c.type === 'list');

      let fullText = '';
      if (paragraphs.length) {
        fullText += paragraphs.join('\n\n');
      }
      if (lists.length) {
        if (fullText) fullText += '\n\n';
        lists.forEach(list => {
          fullText += list.items.map(item => `• ${item}`).join('\n');
        });
      }
      slide.text = fullText;
      delete slide.content;
    }
  });

  return slides;
}

/**
 * Добавление финального слайда
 */
function addFinalSlide(slides, settings) {
  const finalSlideConfig = settings.finalSlide;
  if (!finalSlideConfig?.enabled) return slides;

  const templates = {
    cta: { title: 'Подписывайтесь!', text: 'Больше контента в профиле', color: 'accent' },
    contact: { title: 'Связаться:', text: 'email@example.com\n\nTelegram: @username', color: 'default' },
    brand: { title: 'Спасибо за внимание!', text: 'Помогаю бизнесу расти', color: 'accent' }
  };

  const template = templates[finalSlideConfig.type] || templates.cta;
  const finalSlide = {
    type: 'text',
    ...template,
    title: finalSlideConfig.title || template.title,
    text: finalSlideConfig.text || template.text,
    color: finalSlideConfig.color || template.color
  };

  return [...slides, finalSlide];
}

module.exports = {
  parseMarkdownToSlides,
  addFinalSlide
};