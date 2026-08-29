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

// Inline-клавіатура для розділу "Налаштування вітрини"
const showcaseInlineMenu = Markup.inlineKeyboard([
  [Markup.button.callback('🏷️ Назва магазину', 'showcase_name')],
  [Markup.button.callback('👤 Ваше ім\'я', 'showcase_owner')],
  [Markup.button.callback('🎨 Акцентний колір', 'showcase_color')],
  [Markup.button.callback('✍️ Текст банера', 'showcase_text')],
  [Markup.button.callback('🖼️ Фото банера', 'showcase_photo')]
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

// Кнопка "🎨 Налаштування вітрини"
bot.hears('🎨 Налаштування вітрини', (ctx) => {
  const messageText = 
    `🎨 **Налаштування вітрини**\n\n` +
    `**Акцентний колір:** #275700\n` +
    `**Текст банера:** — за замовчуванням\n` +
    `**Фото банера:** ✅ встановлено\n` +
    `**Категорії:** футболки та топи\n` +
    `_Категорії беруться в товарах - додайте категорію товару, і вона з'явиться тут._\n\n` +
    `Зміни одразу видно покупцям у вітрині.`;

  ctx.reply(messageText, {
    parse_mode: 'Markdown',
    ...showcaseInlineMenu
  });
});

// Заглушки для натискання inline-кнопок
bot.action('showcase_name', (ctx) => ctx.answerCbQuery('Назва магазину'));
bot.action('showcase_owner', (ctx) => ctx.answerCbQuery('Ваше ім\'я'));
bot.action('showcase_color', (ctx) => ctx.answerCbQuery('Акцентний колір'));
bot.action('showcase_text', (ctx) => ctx.answerCbQuery('Текст банера'));
bot.action('showcase_photo', (ctx) => ctx.answerCbQuery('Фото банера'));

// Інші кнопки
bot.hears('🚀 Створити магазин', (ctx) => ctx.reply('🚀 Розділ створення магазину у розробці...'));
bot.hears('📖 Інструкція', (ctx) => ctx.reply('📖 Розділ інструкцій у розробці...'));
bot.hears('💳 Підписка та Триал', (ctx) => ctx.reply('💳 Розділ підписки у розробці...'));
bot.hears('💳 Реквізити магазину', (ctx) => ctx.reply('💳 Розділ реквізитів у розробці...'));
bot.hears('🔌 Інтеграції', (ctx) => ctx.reply('🔌 Розділ інтеграцій у розробці...'));
bot.hears('💎 Підписка', (ctx) => ctx.reply('💎 Розділ підписки у розробці...'));

bot.launch();
console.log('Бот успішно запущено!');
