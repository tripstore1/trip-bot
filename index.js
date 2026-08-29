const { Telegraf, Markup } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const bot = new Telegraf(process.env.BOT_TOKEN);

const userStates = {};

const mainReplyMenu = Markup.keyboard([
  ['🚀 Створити магазин', '⚙️ Налаштування сайту'],
  ['📖 Інструкція', '💳 Підписка та Триал']
]).resize();

const settingsReplyMenu = Markup.keyboard([
  ['💳 Реквізити магазину', '🎨 Налаштування вітрини'],
  ['🔌 Інтеграції', '💎 Підписка'],
  ['⬅️ Назад в головне меню']
]).resize();

const showcaseInlineMenu = Markup.inlineKeyboard([
  [Markup.button.callback('🏷️ Назва магазину', 'set_store_name')],
  [Markup.button.callback('👤 Ваше ім\'я', 'set_owner_name')],
  [Markup.button.callback('🎨 Акцентний колір', 'set_color')],
  [Markup.button.callback('✍️ Текст банера', 'set_banner_text')],
  [Markup.button.callback('🖼️ Фото банера', 'set_banner_photo')]
]);

const colorPaletteMenu = Markup.inlineKeyboard([
  [
    Markup.button.callback('⚪ Білий', 'color_#FFFFFF'),
    Markup.button.callback('⚫ Чорний', 'color_#000000')
  ],
  [
    Markup.button.callback('🔵 Синій', 'color_#2F5FD0'),
    Markup.button.callback('🟢 Зелений', 'color_#275700')
  ],
  [
    Markup.button.callback('🟣 Фіолетовий', 'color_#8A2BE2'),
    Markup.button.callback('🔴 Червоний', 'color_#FF3B30')
  ],
  [Markup.button.callback('⬅️ Назад', 'back_to_showcase')]
]);

async function getOrCreateSeller(telegramId) {
  const tid = String(telegramId);
  try {
    let { data: seller } = await supabase.from('sellers').select('*').eq('telegram_id', tid).maybeSingle();
    if (!seller) {
      const { data: created } = await supabase.from('sellers').insert([{
        telegram_id: tid,
        store_name: 'TRIP STORE 🇺🇦',
        owner_name: 'Адмін',
        theme_color: '#275700',
        banner_text: 'Оригінальний одяг та аксесуари'
      }]).select().single();
      seller = created;
    }
    return seller || {};
  } catch (err) {
    console.error('getOrCreateSeller error:', err);
    return {};
  }
}

async function renderShowcaseMenu(ctx) {
  const seller = await getOrCreateSeller(ctx.from.id);
  const text = 
    `🎨 **Налаштування вітрини**\n\n` +
    `**Назва:** ${seller.store_name || 'TRIP STORE 🇺🇦'}\n` +
    `**Ім'я власника:** ${seller.owner_name || 'Адмін'}\n` +
    `**Акцентний колір:** \`${seller.theme_color || '#275700'}\`\n` +
    `**Текст банера:** ${seller.banner_text || 'Оригінальний одяг та аксесуари'}\n` +
    `**Фото банера:** ${seller.banner_photo ? '✅ встановлено' : '❌ не встановлено'}\n\n` +
    `Зміни одразу видно покупцям у вітрині.`;

  return { text, extra: { parse_mode: 'Markdown', ...showcaseInlineMenu } };
}

bot.start(async (ctx) => {
  delete userStates[ctx.from.id];
  await getOrCreateSeller(ctx.from.id);
  ctx.reply('Вітаємо в конструкторі магазинів! 🛍️\n\nОберіть потрібний розділ:', mainReplyMenu);
});

bot.hears('⚙️ Налаштування сайту', (ctx) => {
  delete userStates[ctx.from.id];
  ctx.reply('⚙️ **Налаштування сайту**\n\nОберіть розділ:', { parse_mode: 'Markdown', ...settingsReplyMenu });
});

bot.hears('⬅️ Назад в головне меню', (ctx) => {
  delete userStates[ctx.from.id];
  ctx.reply('Повертаємось у головне меню ↩️', mainReplyMenu);
});

bot.hears('🎨 Налаштування вітрини', async (ctx) => {
  delete userStates[ctx.from.id];
  const menu = await renderShowcaseMenu(ctx);
  await ctx.reply(menu.text, menu.extra);
});

bot.action('set_store_name', (ctx) => {
  userStates[ctx.from.id] = 'awaiting_store_name';
  ctx.answerCbQuery();
  ctx.reply('🏷️ **Назва магазину**\n\nНадішліть нову назву магазину, яку побачать покупці на вітрині:');
});

bot.action('set_owner_name', (ctx) => {
  userStates[ctx.from.id] = 'awaiting_owner_name';
  ctx.answerCbQuery();
  ctx.reply('👤 **Ваше ім\'я**\n\nНадішліть нове ім\'я (його бачите ви в кабінеті; покупцям показується назва магазину):');
});

bot.action('set_banner_text', (ctx) => {
  userStates[ctx.from.id] = 'awaiting_banner_text';
  ctx.answerCbQuery();
  ctx.reply('✍️ **Текст банера**\n\nНадішліть новий текст (до 100 символів) — він показується під назвою магазину на головній сторінці вітрини:');
});

bot.action('set_banner_photo', (ctx) => {
  userStates[ctx.from.id] = 'awaiting_banner_photo';
  ctx.answerCbQuery();
  ctx.reply(
    '🖼️ **Фото банера**\n\n' +
    'Надішліть фото — воно стане фоном головного екрана вітрини.\n\n' +
    'Рекомендований розмір: 1200×1600, вертикальне.\n' +
    'Порада: для максимальної якості надішліть банер файлом.'
  );
});

bot.action('set_color', async (ctx) => {
  delete userStates[ctx.from.id];
  const seller = await getOrCreateSeller(ctx.from.id);
  ctx.answerCbQuery();
  ctx.reply(
    `🎨 **Акцентний колір**\n\nПоточний: \`${seller.theme_color || '#275700'}\`\n\nОберіть зі списку або надішліть свій HEX-код (наприклад \`#FF6B00\`):`,
    { parse_mode: 'Markdown', ...colorPaletteMenu }
  );
  userStates[ctx.from.id] = 'awaiting_color_hex';
});

bot.action(/^color_(#.+)$/, async (ctx) => {
  const selectedColor = ctx.match[1];
  delete userStates[ctx.from.id];
  await supabase.from('sellers').update({ theme_color: selectedColor }).eq('telegram_id', String(ctx.from.id));
  ctx.answerCbQuery('Колір збережено!');
  ctx.reply(`✅ Акцентний колір успішно змінено на ${selectedColor}`);
  const menu = await renderShowcaseMenu(ctx);
  ctx.reply(menu.text, menu.extra);
});

bot.action('back_to_showcase', async (ctx) => {
  delete userStates[ctx.from.id];
  ctx.answerCbQuery();
  const menu = await renderShowcaseMenu(ctx);
  ctx.reply(menu.text, menu.extra);
});

bot.on('message', async (ctx) => {
  const state = userStates[ctx.from.id];
  if (!state) return;

  const tid = String(ctx.from.id);

  if (state === 'awaiting_store_name' && ctx.message.text) {
    await supabase.from('sellers').update({ store_name: ctx.message.text }).eq('telegram_id', tid);
    await ctx.reply(`✅ Назву магазину змінено на: **${ctx.message.text}**`, { parse_mode: 'Markdown' });
  } else if (state === 'awaiting_owner_name' && ctx.message.text) {
    await supabase.from('sellers').update({ owner_name: ctx.message.text }).eq('telegram_id', tid);
    await ctx.reply(`✅ Ваше ім'я змінено на: **${ctx.message.text}**`, { parse_mode: 'Markdown' });
  } else if (state === 'awaiting_banner_text' && ctx.message.text) {
    await supabase.from('sellers').update({ banner_text: ctx.message.text }).eq('telegram_id', tid);
    await ctx.reply(`✅ Текст банера оновлено: **${ctx.message.text}**`, { parse_mode: 'Markdown' });
  } else if (state === 'awaiting_color_hex' && ctx.message.text) {
    if (/^#[0-9A-F]{6}$/i.test(ctx.message.text.trim())) {
      const hexColor = ctx.message.text.trim().toUpperCase();
      await supabase.from('sellers').update({ theme_color: hexColor }).eq('telegram_id', tid);
      await ctx.reply(`✅ Колір збережено: \`${hexColor}\``, { parse_mode: 'Markdown' });
    } else {
      return ctx.reply('❌ Некоректний HEX-код. Введіть у форматі `#FF6B00` або оберіть із палітри вище.');
    }
  } else if (state === 'awaiting_banner_photo') {
    let photoUrl = '';
    if (ctx.message.photo && ctx.message.photo.length > 0) {
      const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
      const link = await ctx.telegram.getFileLink(fileId);
      photoUrl = link.href;
    } else if (ctx.message.document) {
      const link = await ctx.telegram.getFileLink(ctx.message.document.file_id);
      photoUrl = link.href;
    } else if (ctx.message.text && ctx.message.text.startsWith('http')) {
      photoUrl = ctx.message.text.trim();
    }

    if (photoUrl) {
      await supabase.from('sellers').update({ banner_photo: photoUrl }).eq('telegram_id', tid);
      await ctx.reply('✅ Фото банера успішно завантажено та збережено!');
    } else {
      return ctx.reply('❌ Надішліть зображення або посилання на фото.');
    }
  }

  delete userStates[ctx.from.id];
  const menu = await renderShowcaseMenu(ctx);
  await ctx.reply(menu.text, menu.extra);
});

bot.launch();
console.log('Бот кастомізації успішно запущено!');
