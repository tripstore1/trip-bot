const { Telegraf, Markup } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const bot = new Telegraf(process.env.BOT_TOKEN);

// Головне меню (нижня клавіатура)
const mainReplyMenu = Markup.keyboard([
  ['🚀 Створити магазин', '⚙️ Налаштування сайту'],
  ['📖 Інструкція', '💳 Підписка та Триал']
]).resize();

// Меню налаштувань (нижня клавіатура)
const settingsReplyMenu = Markup.keyboard([
  ['💳 Реквізити магазину', '🎨 Налаштування вітрини'],
  ['🔌 Інтеграції', '💎 Підписка'],
  ['⬅️ Назад в головне меню']
]).resize();

// Обробка /start
bot.start(async (ctx) => {
  const telegramId = ctx.from.id;

  let { data: seller } = await supabase.from('sellers').select('*').eq('telegram_id', telegramId).single();
  if (!seller) {
    const { data } = await supabase.from('sellers').insert([{ telegram_id: telegramId }]).select().single();
    seller = data;
  }

  ctx.reply(
    'Вітаємо в конструкторі магазинів! 🛍️\n\nОберіть потрібний розділ у меню нижче:',
    mainReplyMenu
  );
});

// Кнопка "⚙️ Налаштування сайту"
bot.hears('⚙️ Налаштування сайту', (ctx) => {
  ctx.reply('⚙️ **Налаштування сайту**\n\nОберіть розділ для налаштування:', {
    parse_mode: 'Markdown',
    ...settingsReplyMenu
  });
});

// Кнопка "⬅️ Назад в головне меню"
bot.hears('⬅️ Назад в головне меню', (ctx) => {
  ctx.reply('Повертаємось у головне меню ↩️', mainReplyMenu);
});

// Головне меню - інші кнопки
bot.hears('🚀 Створити магазин', (ctx) => {
  ctx.reply('🚀 Розділ створення магазину у розробці...');
});

bot.hears('📖 Інструкція', (ctx) => {
  ctx.reply('📖 Розділ інструкцій у розробці...');
});

bot.hears('💳 Підписка та Триал', (ctx) => {
  ctx.reply('💳 Розділ підписки у розробці...');
});

// Меню налаштувань - підрозділи
bot.hears('💳 Реквізити магазину', (ctx) => {
  ctx.reply('💳 Розділ реквізитів у розробці...');
});

bot.hears('🎨 Налаштування вітрини', (ctx) => {
  ctx.reply('🎨 Розділ кастомізації вітрини у розробці...');
});

bot.hears('🔌 Інтеграції', (ctx) => {
  ctx.reply('🔌 Розділ інтеграцій у розробці...');
});

bot.hears('💎 Підписка', (ctx) => {
  ctx.reply('💎 Розділ підписки у розробці...');
});

bot.launch();
console.log('Бот успішно запущено з Reply-меню!');
