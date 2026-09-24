import express from 'express';

const app = express();
const PORT = Number(process.env.PORT || 10000);
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://sushi-house-9clk.onrender.com';

app.use(express.json({ limit: '32kb' }));

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin === ALLOWED_ORIGIN) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, telegramConfigured: Boolean(BOT_TOKEN && CHAT_ID) });
});

function clean(value, max = 500) {
  return String(value ?? '').trim().slice(0, max);
}

function escapeHtml(value) {
  return clean(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatOrder(order) {
  const lines = [
    '🍣 <b>НОВЫЙ ЗАКАЗ SUSHI HOUSE</b>',
    '',
    `👤 <b>Имя:</b> ${escapeHtml(order.name)}`,
    `📞 <b>Телефон:</b> ${escapeHtml(order.phone)}`,
    `🚚 <b>Получение:</b> ${order.delivery === 'pickup' ? 'Самовывоз' : 'Доставка'}`,
  ];

  if (order.delivery !== 'pickup') {
    lines.push(`📍 <b>Адрес:</b> ${escapeHtml(order.address)}`);
  }

  lines.push('', '🛒 <b>Состав:</b>');
  for (const item of Array.isArray(order.items) ? order.items.slice(0, 50) : []) {
    const name = escapeHtml(item.name);
    const qty = Math.max(1, Math.min(99, Number(item.qty) || 1));
    const price = Math.max(0, Number(item.price) || 0);
    lines.push(`• ${name} × ${qty} — ${(price * qty).toLocaleString('ru-RU')} ₽`);
  }

  const total = Math.max(0, Number(order.total) || 0);
  lines.push('', `💰 <b>Итого: ${total.toLocaleString('ru-RU')} ₽</b>`);

  const comment = clean(order.comment);
  if (comment) lines.push(`💬 <b>Комментарий:</b> ${escapeHtml(comment)}`);

  return lines.join('\n');
}

let lastRequestAt = 0;
app.post('/api/order', async (req, res) => {
  const now = Date.now();
  if (now - lastRequestAt < 3000) return res.status(429).json({ ok: false, error: 'too_many_requests' });
  lastRequestAt = now;

  if (!BOT_TOKEN || !CHAT_ID) return res.status(500).json({ ok: false, error: 'telegram_not_configured' });

  const order = req.body || {};
  if (!clean(order.name, 100) || !clean(order.phone, 40) || !Array.isArray(order.items) || !order.items.length) {
    return res.status(400).json({ ok: false, error: 'invalid_order' });
  }
  if (order.delivery !== 'pickup' && !clean(order.address, 300)) {
    return res.status(400).json({ ok: false, error: 'address_required' });
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: formatOrder(order),
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      console.error('Telegram API error', data);
      return res.status(502).json({ ok: false, error: 'telegram_error' });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(502).json({ ok: false, error: 'telegram_request_failed' });
  }
});

app.listen(PORT, () => console.log(`Sushi House Telegram server listening on ${PORT}`));
