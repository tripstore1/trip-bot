const { Telegraf, Markup } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const bot = new Telegraf(process.env.BOT_TOKEN);

const mainMenu = Markup.inlineKeyboard([
  [Markup.button.callback('🚀 Створити магазин', 'create_store')],
  [Markup.button.callback('⚙️ Налаштування сайту', 'settings')],
  [Markup.button.callback('📖 Інструкція', 'instructions')],
  [Markup.button.callback('💳 Підписка та Триал', 'subscription')]
]);

bot.start(async (ctx) => {
  const telegramId = ctx.from.id;
  
  let { data: seller } = await supabase.from('sellers').select('*').eq('telegram_id', telegramId).single();
  if (!seller) {
    const { data } = await supabase.from('sellers').insert([{ telegram_id: telegramId }]).select().single();
    seller = data;
  }

  ctx.reply(`Вітаємо в конструкторі магазинів! 🛍️\n\nТут ти можеш підключити свій Telegram-бот та отримати готовий Mini App магазин.`, mainMenu);
});

bot.action('instructions', (ctx) => {
  ctx.reply(
    `📖 *Як створити та налаштувати магазин:*\n\n` +
    `1. Зайди в @BotFather та створи нового бота (/newbot).\n` +
    `2. Скопіюй отриманий **API Token**.\n` +
    `3. Натисни *🚀 Створити магазин* у цьому боті та надішли токен.\n` +
    `4. Налаштуй назву, банер і колір кнопкою *⚙️ Налаштування сайту*.`,
    { parse_mode: 'Markdown', ...mainMenu }
  );
});

bot.action('subscription', async (ctx) => {
  const telegramId = ctx.from.id;
  const { data: seller } = await supabase.from('sellers').select('*').eq('telegram_id', telegramId).single();
  
  if (!seller) return ctx.reply('Натисніть /start');

  const trialEnds = new Date(seller.trial_ends_at);
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((trialEnds - now) / (1000 * 60 * 60 * 24)));

  ctx.reply(
    `💳 *Cтатус підписки:*\n\n` +
    `Статус: ${seller.subscription_active ? '✅ Активна' : '❌ Заблоковано'}\n` +
    `Залишилося триалу: *${daysLeft} днів*\n\n` +
    `Вартість продовження: **200 грн / місяць**.`,
    { parse_mode: 'Markdown', ...mainMenu }
  );
});

bot.launch();
console.log('Бот працює!');
