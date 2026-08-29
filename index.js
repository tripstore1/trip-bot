const { Telegraf, Markup } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const bot = new Telegraf(process.env.BOT_TOKEN);

// Головне меню конструктора
const mainMenu = Markup.inlineKeyboard([
  [Markup.button.callback('🚀 Створити магазин', 'create_store')],
  [Markup.button.callback('⚙️ Налаштування сайту', 'settings')],
  [Markup.button.callback('📖 Інструкція', 'instructions')],
  [Markup.button.callback('💳 Підписка та Триал', 'subscription')]
]);

// Підменю "Налаштування сайту"
const settingsMenu = Markup.inlineKeyboard([
  [Markup.button.callback('💳 Реквізити магазину', 'settings_requisites')],
  [Markup.button.callback('🎨 Налаштування вітрини', 'settings_showcase')],
  [Markup.button.callback('🔌 Інтеграції', 'settings_integrations')],
  [Markup.button.callback('💎 Підписка', 'settings_subscription')],
  [Markup.button.callback('⬅️ Назад в головне меню', 'back_to_main')]
]);

// Обробка /start
bot.start(async (ctx) => {
  const telegramId = ctx.from.id;

  let { data: seller } = await supabase.from('sellers').select('*').eq('telegram_id', telegramId).single();
  if (!seller) {
    const { data } = await supabase.from('sellers').insert([{ telegram_id: telegramId }]).select().single();
    seller = data;
  }

  ctx.reply(
    'Вітаємо в конструкторі магазинів! 🛍️\n\nТут ти можеш підключити свій Telegram-бот та отримати готовий Mini App магазин.',
    mainMenu
  );
});

// Натискання на "⚙️ Налаштування сайту"
bot.action('settings', (ctx) => {
  ctx.editMessageText('⚙️ **Налаштування сайту**\n\nОберіть розділ для налаштування:', {
    parse_mode: 'Markdown',
    ...settingsMenu
  });
});

// Назад у головне меню
bot.action('back_to_main', (ctx) => {
  ctx.editMessageText(
    'Вітаємо в конструкторі магазинів! 🛍️\n\nТут ти можеш підключити свій Telegram-бот та отримати готовий Mini App магазин.',
    mainMenu
  );
});

// Обробники кнопок підменю
bot.action('settings_requisites', (ctx) => {
  ctx.answerCbQuery();
  ctx.reply('💳 Розділ реквізитів у розробці...');
});

bot.action('settings_showcase', (ctx) => {
  ctx.answerCbQuery();
  ctx.reply('🎨 Розділ кастомізації вітрини у розробці...');
});

bot.action('settings_integrations', (ctx) => {
  ctx.answerCbQuery();
  ctx.reply('🔌 Розділ інтеграцій у розробці...');
});

bot.action('settings_subscription', (ctx) => {
  ctx.answerCbQuery();
  ctx.reply('💎 Розділ підписки у розробці...');
});

bot.launch();
console.log('Бот успішно запущено!');
