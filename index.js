const { Telegraf, Markup } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const bot = new Telegraf(process.env.BOT_TOKEN);

// Головне меню (Inline)
const mainMenu = Markup.inlineKeyboard([
  [Markup.button.callback('🚀 Створити магазин', 'create_store')],
  [Markup.button.callback('⚙️ Налаштування сайту', 'settings')],
  [Markup.button.callback('📖 Інструкція', 'instructions')],
  [Markup.button.callback('💳 Підписка та Триал', 'subscription')]
]);

// Меню налаштувань у стилі Reply-клавіатури (у 2 стовпчики)
const replySettingsMenu = Markup.keyboard([
  ['💳 Реквізити магазину', '🎨 Налаштування вітрини'],
  ['⚙️ Інтеграції', '💳 Підписка'],
  ['⬅️ Назад']
]).resize();

// Скидання Reply-клавіатури
const removeKeyboard = Markup.removeKeyboard();

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

// При натисканні на "⚙️ Налаштування сайту" надсилаємо текстове повідомлення і відкриваємо нижню клавіатуру
bot.action('settings', (ctx) => {
  ctx.answerCbQuery();
  ctx.reply('⚙️ Налаштування', replySettingsMenu);
});

// Обробка текстових кнопок з нижньої клавіатури
bot.hears('💳 Реквізити магазину', (ctx) => {
  ctx.reply('💳 Розділ реквізитів у розробці...');
});

bot.hears('🎨 Налаштування вітрини', (ctx) => {
  ctx.reply('🎨 Розділ кастомізації вітрини у розробці...');
});

bot.hears('⚙️ Інтеграції', (ctx) => {
  ctx.reply('🔌 Розділ інтеграцій у розробці...');
});

bot.hears('💳 Підписка', (ctx) => {
  ctx.reply('💎 Розділ підписки у розробці...');
});

// Кнопка "⬅️ Назад" ховає нижню клавіатуру та виводить головне меню
bot.hears('⬅️ Назад', (ctx) => {
  ctx.reply('Повертаємось у головне меню...', removeKeyboard).then(() => {
    ctx.reply(
      'Вітаємо в конструкторі магазинів! 🛍️\n\nТут ти можеш підключити свій Telegram-бот та отримати готовий Mini App магазин.',
      mainMenu
    );
  });
});

bot.launch();
console.log('Бот успішно запущено!');
