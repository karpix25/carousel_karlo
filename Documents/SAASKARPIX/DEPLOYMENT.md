# Развертывание на Easypanel

Это руководство поможет развернуть приложение Karpix Carousel на платформе Easypanel.

## Предварительные требования

- Аккаунт Easypanel с доступом к панели управления
- Git репозиторий с проектом (GitHub, GitLab, или другой)
- Данные для подключения к Supabase

## Шаг 1: Подготовка репозитория

Убедитесь, что все файлы закоммичены в Git:

```bash
git add .
git commit -m "Add Easypanel deployment configuration"
git push
```

## Шаг 2: Создание приложения в Easypanel

1. Войдите в панель управления Easypanel
2. Нажмите **"Create New App"** или **"New Service"**
3. Выберите **"From Source Code"** (Git)
4. Подключите ваш Git репозиторий

## Шаг 3: Настройка сборки

В настройках приложения укажите:

### Build Settings
- **Build Method**: Docker
- **Dockerfile Path**: `./Dockerfile` (по умолчанию)
- **Build Context**: `.` (корень проекта)

### Port Settings
- **Container Port**: `80`
- **Expose Port**: `80` или `443` (если используете HTTPS)

## Шаг 4: Переменные окружения

Добавьте следующие переменные окружения в настройках приложения:

```
VITE_SUPABASE_PROJECT_ID=votlvlhqoxiihoequqsp
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvdGx2bGhxb3hpaWhvZXF1cXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1Nzk5NzAsImV4cCI6MjA4MjE1NTk3MH0.Df-mAkpzfIZBhb7AppOhgqy9ojqsRyyrGV4Xmz_N6Zo
VITE_SUPABASE_URL=https://votlvlhqoxiihoequqsp.supabase.co
```

> **Важно**: Эти переменные должны быть установлены **до сборки**, так как Vite встраивает их в код во время сборки.

## Шаг 5: Настройка домена (опционально)

1. В настройках приложения перейдите в раздел **Domains**
2. Добавьте свой домен или используйте предоставленный Easypanel поддомен
3. Настройте SSL сертификат (обычно автоматически через Let's Encrypt)

## Шаг 6: Развертывание

1. Нажмите **"Deploy"** или **"Build & Deploy"**
2. Дождитесь завершения сборки (обычно 2-5 минут)
3. Проверьте логи сборки на наличие ошибок

## Шаг 7: Проверка работоспособности

После успешного развертывания:

1. Откройте URL приложения в браузере
2. Проверьте, что приложение загружается корректно
3. Проверьте подключение к Supabase (попробуйте функции, требующие БД)
4. Проверьте навигацию между страницами (SPA routing)

## Локальное тестирование Docker образа

Перед развертыванием на Easypanel можно протестировать Docker образ локально:

```bash
# Сборка образа
docker build -t karpix-carousel .

# Запуск контейнера
docker run -p 8080:80 \
  -e VITE_SUPABASE_PROJECT_ID=votlvlhqoxiihoequqsp \
  -e VITE_SUPABASE_PUBLISHABLE_KEY=your_key_here \
  -e VITE_SUPABASE_URL=https://votlvlhqoxiihoequqsp.supabase.co \
  karpix-carousel

# Откройте http://localhost:8080 в браузере
```

Или используйте docker-compose:

```bash
# Создайте файл .env с переменными окружения
cp .env.example .env
# Отредактируйте .env с реальными значениями

# Запуск
docker-compose up --build

# Откройте http://localhost в браузере
```

## Автоматическое развертывание

Easypanel может автоматически пересобирать приложение при push в Git:

1. В настройках приложения включите **Auto Deploy**
2. Выберите ветку для отслеживания (например, `main` или `master`)
3. Теперь каждый push в эту ветку будет автоматически запускать новую сборку

## Troubleshooting

### Приложение не загружается
- Проверьте логи контейнера в Easypanel
- Убедитесь, что порт 80 правильно настроен
- Проверьте, что Nginx запустился корректно

### Ошибки подключения к Supabase
- Проверьте правильность переменных окружения
- Убедитесь, что переменные установлены **до сборки**
- Пересоберите приложение после изменения переменных

### 404 ошибки на маршрутах
- Проверьте, что `nginx.conf` правильно настроен для SPA
- Убедитесь, что файл `nginx.conf` скопирован в образ

### Медленная загрузка
- Проверьте, что Gzip сжатие работает (в nginx.conf)
- Убедитесь, что статические ресурсы кэшируются

## Мониторинг и логи

В Easypanel вы можете:
- Просматривать логи в реальном времени
- Мониторить использование ресурсов (CPU, RAM)
- Настроить алерты при проблемах

## Обновление приложения

Для обновления приложения:

1. Внесите изменения в код
2. Закоммитьте и запушьте в Git
3. Easypanel автоматически пересоберет (если включен Auto Deploy)
4. Или нажмите **"Rebuild"** вручную в панели управления

## Дополнительные ресурсы

- [Easypanel Documentation](https://easypanel.io/docs)
- [Vite Production Build](https://vitejs.dev/guide/build.html)
- [Supabase Documentation](https://supabase.com/docs)
