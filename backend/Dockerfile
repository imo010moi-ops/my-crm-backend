# Используем официальный образ Node.js
FROM node:20

# Создаем рабочую директорию внутри контейнера
WORKDIR /app

# Копируем файлы настроек (package.json и package-lock.json при наличии)
COPY package*.json ./

# Устанавливаем только необходимые библиотеки
RUN npm install --omit=dev

# Копируем весь остальной код из папки backend в контейнер
COPY . .

# Четко указываем путь к главному файлу внутри папки src
CMD ["node", "src/server.js"]
