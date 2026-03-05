WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
# Указываем правильный путь к файлу внутри папки src
CMD ["node", "src/server.js"]
