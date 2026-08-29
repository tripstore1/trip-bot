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

async function getSeller(telegramId) {
  const numericId = Number(telegramId);
  const { data } = await supabase.from('sellers').select('*').eq('telegram_id', numericId).maybeSingle();
  return data || {};
}

async function updateSellerData(telegramId, updateFields) {
  const numericId = Number(telegramId);
  const existing = await getSeller(numericId);

  if (!existing || !existing.telegram_id) {
    const { data } = await supabase
      .from('sellers')
      .insert([{ telegram_id: numericId, ...updateFields }])
      .select();
    return data;
  } else {
    const { data } = await supabase
      .from('sellers')
      .update(updateFields)
      .eq('telegram_id', numericId)
      .select();
    return data;
  }
}

async function renderShowcaseMenu(ctx) {
  const seller = await getSeller(ctx.from.id);
  const hasPhoto = Boolean(seller.banner_photo && seller.banner_photo.trim() !== '');
  
  const text = 
    `🎨 **Налаштування вітрини**\n\n` +
    `**Назва:** ${seller.store_name || 'TRIP STORE 🇺🇦'}\n` +
    `**Ім'я власника:** ${seller.owner_name || 'Адмін'}\n` +
    `**Акцентний колір:** \`${seller.theme_color || '#275700'}\`\n` +
    `**Текст банера:** ${seller.banner_text || 'Оригінальний одяг та аксесуари'}\n` +
    `**Фото банера:** ${hasPhoto ? '✅ встановлено' : '❌ не встановлено'}\n\n` +
    `Зміни одразу видно покупцям у вітрині.`;

  return { text, extra: { parse_mode: 'Markdown', ...showcaseInlineMenu } };
}

bot.start(async (ctx) => {
  delete userStates[ctx.from.id];
  await updateSellerData(ctx.from.id, {});
  ctx.reply('Вітаємо в конструкторі магазинів! 🛍️\n\nОберіть потрібний розділ:', mainReplyMenu);
});

bot.hears('🚀 Створити магазин', async (ctx) => {
  delete userStates[ctx.from.id];
  const webAppUrl = `https://tripstore1-trip-web.vercel.app/?seller_id=${ctx.from.id}`;

  await ctx.reply('🛍️ **Ваш персональний магазин готовий!**\n\nНатисніть кнопку нижче, щоб відкрити його:', {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🌐 Відкрити свій сайт', web_app: { url: webAppUrl } }]
      ]
    }
  });
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
  ctx.reply('🏷️ **Назва магазину**\n\nНадішліть нову назву магазину:');
});

bot.action('set_owner_name', (ctx) => {
  userStates[ctx.from.id] = 'awaiting_owner_name';
  ctx.answerCbQuery();
  ctx.reply('👤 **Ваше ім\'я**\n\nНадішліть нове ім\'я:');
});

bot.action('set_banner_text', (ctx) => {
  userStates[ctx.from.id] = 'awaiting_banner_text';
  ctx.answerCbQuery();
  ctx.reply('✍️ **Текст банера**\n\nНадішліть новий текст (до 100 символів):');
});

bot.action('set_banner_photo', (ctx) => {
  userStates[ctx.from.id] = 'awaiting_banner_photo';
  ctx.answerCbQuery();
  ctx.reply('🖼️ **Фото банера**\n\nНадішліть фото або пряме посилання на нього:');
});

bot.action('set_color', async (ctx) => {
  delete userStates[ctx.from.id];
  const seller = await getSeller(ctx.from.id);
  ctx.answerCbQuery();
  ctx.reply(
    `🎨 **Акцентний колір**\n\nПоточний: \`${seller.theme_color || '#275700'}\`\n\nОберіть колір або надішліть HEX-код:`,
    { parse_mode: 'Markdown', ...colorPaletteMenu }
  );
  userStates[ctx.from.id] = 'awaiting_color_hex';
});

bot.action(/^color_(#.+)$/, async (ctx) => {
  const selectedColor = ctx.match[1];
  delete userStates[ctx.from.id];
  await updateSellerData(ctx.from.id, { theme_color: selectedColor });
  ctx.answerCbQuery('Колір збережено!');
  ctx.reply(`✅ Акцентний колір змінено на ${selectedColor}`);
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

  if (state === 'awaiting_store_name' && ctx.message.text) {
    await updateSellerData(ctx.from.id, { store_name: ctx.message.text });
    await ctx.reply(`✅ Назву магазину змінено на: **${ctx.message.text}**`, { parse_mode: 'Markdown' });
  } else if (state === 'awaiting_owner_name' && ctx.message.text) {
    await updateSellerData(ctx.from.id, { owner_name: ctx.message.text });
    await ctx.reply(`✅ Ваше ім'я змінено на: **${ctx.message.text}**`, { parse_mode: 'Markdown' });
  } else if (state === 'awaiting_banner_text' && ctx.message.text) {
    await updateSellerData(ctx.from.id, { banner_text: ctx.message.text });
    await ctx.reply(`✅ Текст банера оновлено: **${ctx.message.text}**`, { parse_mode: 'Markdown' });
  } else if (state === 'awaiting_color_hex' && ctx.message.text) {
    if (/^#[0-9A-F]{6}$/i.test(ctx.message.text.trim())) {
      const hexColor = ctx.message.text.trim().toUpperCase();
      await updateSellerData(ctx.from.id, { theme_color: hexColor });
      await ctx.reply(`✅ Колір збережено: \`${hexColor}\``, { parse_mode: 'Markdown' });
    } else {
      return ctx.reply('❌ Некоректний HEX-код. Формат: `#FF6B00`.');
    }
  } else if (state === 'awaiting_banner_photo') {
    let photoUrl = '';
    if (ctx.message.photo && ctx.message.photo.length > 0) {
      const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
      const fileLinkObj = await ctx.telegram.getFileLink(fileId);
      photoUrl = String(fileLinkObj.href || fileLinkObj);
    } else if (ctx.message.text && ctx.message.text.startsWith('http')) {
      photoUrl = ctx.message.text.trim();
    }

    if (photoUrl) {
      await updateSellerData(ctx.from.id, { banner_photo: photoUrl });
      await ctx.reply('✅ Фото банера успішно завантажено!');
    } else {
      return ctx.reply('❌ Надішліть фотографію.');
    }
  }

  delete userStates[ctx.from.id];
  const menu = await renderShowcaseMenu(ctx);
  await ctx.reply(menu.text, menu.extra);
});

bot.launch();
console.log('Бот успішно запущено!');
