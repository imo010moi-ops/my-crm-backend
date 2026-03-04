import { Telegraf, Markup } from 'telegraf';
import dotenv from 'dotenv';
import cron from 'node-cron';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale/index.js';

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL;
const API_URL = process.env.API_URL || 'http://localhost:3000';

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN is required');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// Keyboard layouts
const getMainKeyboard = (role = 'client') => {
  if (role === 'master') {
    return Markup.keyboard([
      ['📋 Мои записи', '📅 Календарь'],
      ['⚙️ Услуги', '👤 Профиль'],
      ['📊 Статистика', '❓ Помощь']
    ]).resize();
  }
  
  return Markup.keyboard([
    ['🔍 Найти мастера', '📋 Мои записи'],
    ['👤 Профиль', '❓ Помощь']
  ]).resize();
};

const getWebAppButton = (text = 'Открыть приложение', path = '') => {
  return Markup.button.webApp(text, `${WEBAPP_URL}${path}`);
};

// Start command
bot.start(async (ctx) => {
  const user = ctx.from;
  
  try {
    // Register/update user in backend
    await axios.post(`${API_URL}/api/auth/telegram-auth`, {
      initData: `user=${JSON.stringify({
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name
      })}`
    });

    const welcomeMessage = `
👋 Привет, ${user.first_name}!

Добро пожаловать в CRM для мастеров и клиентов.

📱 Здесь вы можете:
${user.username ? '✅ Зарегистрироваться как мастер\n✅ Управлять записями\n✅ Настраивать услуги' : '✅ Найти мастера\n✅ Записаться на услугу\n✅ Управлять своими записями'}

Выберите действие ниже 👇
    `;

    await ctx.reply(welcomeMessage, {
      reply_markup: {
        keyboard: [[getWebAppButton('🚀 Открыть приложение')]],
        resize_keyboard: true
      }
    });
  } catch (error) {
    console.error('Error in start command:', error.message);
    ctx.reply('❌ Произошла ошибка. Попробуйте позже.');
  }
});

// Help command
bot.help((ctx) => {
  ctx.reply(`
📖 <b>Справка по использованию бота</b>

<b>Для клиентов:</b>
• Найдите мастера через приложение
• Выберите услугу и удобное время
• Получайте напоминания о записях

<b>Для мастеров:</b>
• Настройте свой профиль и услуги
• Управляйте рабочим графиком
• Получайте уведомления о новых записях

<b>Команды:</b>
/start - Начать работу
/help - Показать справку
/profile - Ваш профиль
/bookings - Ваши записи

Есть вопросы? Напишите нам!
  `, { parse_mode: 'HTML' });
});

// Profile command
bot.command('profile', async (ctx) => {
  ctx.reply('👤 Ваш профиль', {
    reply_markup: {
      keyboard: [[getWebAppButton('Открыть профиль', '/profile')]],
      resize_keyboard: true
    }
  });
});

// Bookings command
bot.command('bookings', async (ctx) => {
  ctx.reply('📋 Ваши записи', {
    reply_markup: {
      keyboard: [[getWebAppButton('Показать записи', '/bookings')]],
      resize_keyboard: true
    }
  });
});

// Handle text messages
bot.hears('🔍 Найти мастера', (ctx) => {
  ctx.reply('🔍 Поиск мастеров', {
    reply_markup: {
      keyboard: [[getWebAppButton('Найти мастера', '/masters')]],
      resize_keyboard: true
    }
  });
});

bot.hears('📋 Мои записи', (ctx) => {
  ctx.reply('📋 Ваши записи', {
    reply_markup: {
      keyboard: [[getWebAppButton('Показать записи', '/bookings')]],
      resize_keyboard: true
    }
  });
});

bot.hears('👤 Профиль', (ctx) => {
  ctx.reply('👤 Ваш профиль', {
    reply_markup: {
      keyboard: [[getWebAppButton('Открыть профиль', '/profile')]],
      resize_keyboard: true
    }
  });
});

bot.hears('📅 Календарь', (ctx) => {
  ctx.reply('📅 Календарь записей', {
    reply_markup: {
      keyboard: [[getWebAppButton('Открыть календарь', '/calendar')]],
      resize_keyboard: true
    }
  });
});

bot.hears('⚙️ Услуги', (ctx) => {
  ctx.reply('⚙️ Управление услугами', {
    reply_markup: {
      keyboard: [[getWebAppButton('Управлять услугами', '/services')]],
      resize_keyboard: true
    }
  });
});

bot.hears('📊 Статистика', (ctx) => {
  ctx.reply('📊 Статистика', {
    reply_markup: {
      keyboard: [[getWebAppButton('Показать статистику', '/stats')]],
      resize_keyboard: true
    }
  });
});

bot.hears('❓ Помощь', (ctx) => {
  ctx.replyWithHTML(`
📖 <b>Справка</b>

Если у вас возникли вопросы:
• Проверьте настройки профиля
• Убедитесь, что уведомления включены
• Свяжитесь с поддержкой

Для начала работы нажмите кнопку ниже 👇
  `, {
    reply_markup: {
      keyboard: [[getWebAppButton('🚀 Открыть приложение')]],
      resize_keyboard: true
    }
  });
});

// Notification functions
export const sendNewAppointmentNotification = async (chatId, appointment) => {
  try {
    const message = `
🆕 <b>Новая запись!</b>

📅 <b>Дата:</b> ${format(parseISO(appointment.appointment_date), 'dd MMMM yyyy', { locale: ru })}
🕐 <b>Время:</b> ${appointment.start_time}
💇 <b>Услуга:</b> ${appointment.service_name}
👤 <b>Клиент:</b> ${appointment.client_name || 'Не указано'}
📞 <b>Телефон:</b> ${appointment.client_phone || 'Не указан'}
📝 <b>Примечания:</b> ${appointment.notes || 'Нет'}

<a href="${WEBAPP_URL}/master/bookings">Открыть в приложении</a>
    `;

    await bot.telegram.sendMessage(chatId, message, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Подтвердить', callback_data: `confirm_${appointment.id}` },
            { text: '❌ Отменить', callback_data: `cancel_${appointment.id}` }
          ]
        ]
      }
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

export const sendReminderNotification = async (chatId, appointment) => {
  try {
    const message = `
⏰ <b>Напоминание о записи!</b>

Через 2 часа у вас запись:

📅 <b>Дата:</b> ${format(parseISO(appointment.appointment_date), 'dd MMMM yyyy', { locale: ru })}
🕐 <b>Время:</b> ${appointment.start_time}
💇 <b>Услуга:</b> ${appointment.service_name}
👤 <b>Мастер:</b> ${appointment.master_first_name || 'Не указано'}

<a href="${WEBAPP_URL}/bookings">Мои записи</a>
    `;

    await bot.telegram.sendMessage(chatId, message, {
      parse_mode: 'HTML'
    });
  } catch (error) {
    console.error('Error sending reminder:', error);
  }
};

export const sendStatusUpdateNotification = async (chatId, appointment) => {
  try {
    const statusText = {
      'confirmed': '✅ Подтверждена',
      'completed': '✨ Завершена',
      'cancelled': '❌ Отменена',
      'no_show': '🚫 Клиент не пришел'
    };

    const message = `
📢 <b>Обновление статуса записи</b>

Ваша запись изменила статус: <b>${statusText[appointment.status] || appointment.status}</b>

📅 <b>Дата:</b> ${format(parseISO(appointment.appointment_date), 'dd MMMM yyyy', { locale: ru })}
🕐 <b>Время:</b> ${appointment.start_time}
💇 <b>Услуга:</b> ${appointment.service_name}

<a href="${WEBAPP_URL}/bookings">Мои записи</a>
    `;

    await bot.telegram.sendMessage(chatId, message, {
      parse_mode: 'HTML'
    });
  } catch (error) {
    console.error('Error sending status update:', error);
  }
};

export const sendCancellationNotification = async (chatId, appointment, cancelledBy) => {
  try {
    const cancelledByText = cancelledBy === 'master' ? 'мастером' : 'клиентом';
    
    const message = `
❌ <b>Запись отменена</b>

Запись была отменена ${cancelledByText}.

📅 <b>Дата:</b> ${format(parseISO(appointment.appointment_date), 'dd MMMM yyyy', { locale: ru })}
🕐 <b>Время:</b> ${appointment.start_time}
💇 <b>Услуга:</b> ${appointment.service_name}

<a href="${WEBAPP_URL}/bookings">Мои записи</a>
    `;

    await bot.telegram.sendMessage(chatId, message, {
      parse_mode: 'HTML'
    });
  } catch (error) {
    console.error('Error sending cancellation notification:', error);
  }
};

// Handle callback queries
bot.action(/confirm_(\d+)/, async (ctx) => {
  const appointmentId = ctx.match[1];
  try {
    await axios.patch(`${API_URL}/api/appointments/${appointmentId}/status`, {
      status: 'confirmed'
    });
    await ctx.answerCbQuery('✅ Запись подтверждена');
    await ctx.editMessageText(ctx.callbackQuery.message.text + '\n\n✅ <b>Подтверждено</b>', {
      parse_mode: 'HTML'
    });
  } catch (error) {
    await ctx.answerCbQuery('❌ Ошибка при подтверждении');
  }
});

bot.action(/cancel_(\d+)/, async (ctx) => {
  const appointmentId = ctx.match[1];
  try {
    await axios.post(`${API_URL}/api/appointments/${appointmentId}/cancel`, {
      reason: 'Отменено через бот'
    });
    await ctx.answerCbQuery('❌ Запись отменена');
    await ctx.editMessageText(ctx.callbackQuery.message.text + '\n\n❌ <b>Отменено</b>', {
      parse_mode: 'HTML'
    });
  } catch (error) {
    await ctx.answerCbQuery('❌ Ошибка при отмене');
  }
});

// Reminder cron job (runs every 5 minutes)
cron.schedule('*/5 * * * *', async () => {
  console.log('Checking for reminders...');
  try {
    const response = await axios.get(`${API_URL}/api/reminders/upcoming`);
    const appointments = response.data.appointments;

    for (const appointment of appointments) {
      if (appointment.client_telegram_id) {
        await sendReminderNotification(appointment.client_telegram_id, appointment);
      }
      // Mark reminder as sent
      await axios.post(`${API_URL}/api/reminders/${appointment.id}/mark-sent`);
    }
  } catch (error) {
    console.error('Error in reminder cron job:', error.message);
  }
});

// Launch bot
bot.launch()
  .then(() => {
    console.log('🤖 Bot started successfully');
  })
  .catch((err) => {
    console.error('❌ Bot failed to start:', err);
  });

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

export { bot };
