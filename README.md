# Telegram Mini App CRM

Микро-CRM система внутри Telegram для частных мастеров (бьюти, репетиторы, сервис) и их клиентов.

## 📋 Функциональность

### Для Мастера:
- 👤 Настройка профиля и рабочего графика
- 💇 Управление услугами (цены, длительность)
- 📅 Просмотр и управление записями
- ✅ Подтверждение/отмена/завершение записей
- 📊 Статистика по услугам

### Для Клиента:
- 🔍 Поиск мастеров
- 📆 Запись на услугу с выбором даты и времени
- 📋 Управление своими записями
- 🔔 Уведомления о предстоящих записях

### Уведомления:
- 📨 Мастер получает уведомление о новой записи
- ⏰ Клиент получает напоминание за 2 часа
- 🔄 Уведомления об изменении статуса записи

## 🏗 Архитектура

```
telegram-crm/
├── backend/          # Fastify + PostgreSQL
├── frontend/         # React + Vite + Tailwind CSS
└── bot/             # Telegram Bot (Node.js + Telegraf)
```

## 🚀 Быстрый старт

### Предварительные требования

- Node.js 18+
- PostgreSQL 14+
- Telegram Bot Token (получить у @BotFather)

### 1. Клонирование и настройка

```bash
git clone <repository-url>
cd telegram-crm
```

### 2. Настройка базы данных

```bash
# Создать базу данных
createdb telegram_crm

# Или через psql
psql -U postgres -c "CREATE DATABASE telegram_crm;"
```

### 3. Backend

```bash
cd backend

# Установка зависимостей
npm install

# Настройка переменных окружения
cp .env.example .env
# Отредактируйте .env файл

# Запуск миграций
npm run migrate

# Запуск сервера
npm run dev
```

**Переменные окружения backend (.env):**
```env
DATABASE_URL=postgresql://username:password@localhost:5432/telegram_crm
JWT_SECRET=your-super-secret-jwt-key
BOT_TOKEN=your-telegram-bot-token
WEBAPP_URL=https://your-frontend-domain.com
PORT=3000
NODE_ENV=development
FRONTEND_URL=https://your-frontend-domain.com
```

### 4. Frontend

```bash
cd frontend

# Установка зависимостей
npm install

# Настройка переменных окружения
cp .env.example .env
# Отредактируйте .env файл

# Запуск dev сервера
npm run dev
```

**Переменные окружения frontend (.env):**
```env
VITE_API_URL=http://localhost:3000/api
VITE_BOT_URL=https://t.me/your_bot_username
```

### 5. Telegram Bot

```bash
cd bot

# Установка зависимостей
npm install

# Настройка переменных окружения
cp .env.example .env
# Отредактируйте .env файл

# Запуск бота
npm run dev
```

**Переменные окружения bot (.env):**
```env
BOT_TOKEN=your-telegram-bot-token
WEBAPP_URL=https://your-frontend-domain.com
API_URL=http://localhost:3000
```

## 🤖 Настройка Telegram Bot

1. Напишите @BotFather в Telegram
2. Создайте нового бота: `/newbot`
3. Получите токен бота
4. Настройте WebApp:
   ```
   /setmenubutton
   ```
   - Выберите вашего бота
   - Введите название кнопки: "Открыть приложение"
   - Введите URL: `https://your-frontend-domain.com`

5. Включите настройки для WebApp:
   ```
   /mybots → Выберите бота → Bot Settings → WebApp
   ```

## 📁 Структура проекта

### Backend API Endpoints

**Auth:**
- `POST /api/auth/telegram-auth` - Авторизация через Telegram
- `GET /api/auth/me` - Получить текущего пользователя
- `PUT /api/auth/profile` - Обновить профиль
- `POST /api/auth/register-master` - Регистрация как мастер

**Services:**
- `GET /api/master/:id/services` - Получить услуги мастера
- `GET /api/my-services` - Получить мои услуги (master)
- `POST /api/services` - Создать услугу (master)
- `PUT /api/services/:id` - Обновить услугу (master)
- `DELETE /api/services/:id` - Удалить услугу (master)

**Appointments:**
- `GET /api/masters/:id/slots?date=YYYY-MM-DD` - Получить свободные слоты
- `POST /api/appointments` - Создать запись
- `GET /api/my-appointments` - Получить мои записи
- `GET /api/appointments/today` - Записи на сегодня (master)
- `GET /api/appointments/week` - Записи на неделю (master)
- `PATCH /api/appointments/:id/status` - Обновить статус (master)
- `POST /api/appointments/:id/cancel` - Отменить запись

**Masters:**
- `GET /api/masters` - Получить список мастеров

## 🐳 Docker (опционально)

```bash
# Сборка и запуск всех сервисов
docker-compose up -d

# Остановка
docker-compose down
```

## 🌐 Деплой

### Backend (Railway/Render/Heroku)

1. Создайте аккаунт на [Railway](https://railway.app) или [Render](https://render.com)
2. Подключите GitHub репозиторий
3. Настройте переменные окружения
4. Деплой автоматический при push

### Frontend (Vercel/Netlify)

1. Создайте аккаунт на [Vercel](https://vercel.com) или [Netlify](https://netlify.com)
2. Подключите GitHub репозиторий
3. Укажите root directory: `frontend`
4. Настройте переменные окружения
5. Деплой автоматический при push

### Bot (Railway/Render/Свой сервер)

1. Задеплойте бот на сервер
2. Убедитесь, что процесс работает постоянно (PM2)
3. Настройте webhook (опционально)

## 📱 Использование

### Для мастера:

1. Откройте бота в Telegram
2. Нажмите "Открыть приложение"
3. Заполните профиль и настройте услуги
4. Настройте рабочий график
5. Получайте уведомления о новых записях

### Для клиента:

1. Откройте бота в Telegram
2. Нажмите "Открыть приложение"
3. Найдите мастера
4. Выберите услугу, дату и время
5. Подтвердите запись

## 🔧 Технологии

**Frontend:**
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Telegram Web Apps SDK

**Backend:**
- Node.js
- Fastify
- PostgreSQL
- JWT
- node-cron

**Bot:**
- Node.js
- Telegraf
- node-cron

## 📝 Лицензия

MIT License

## 🤝 Поддержка

При возникновении проблем создавайте Issue в репозитории.
