const RESEND_API_URL = 'https://api.resend.com/emails';

function json(res, statusCode, body) {
  res.status(statusCode).json(body);
}

function normalizeText(value, maxLength) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.replace(/\r\n/g, '\n').trim().slice(0, maxLength);
}

function isAllowedOrigin(origin, allowedOrigins) {
  if (!origin) {
    return true;
  }

  if (allowedOrigins.length > 0) {
    return allowedOrigins.includes(origin);
  }

  return (
    origin === 'https://fnaticpair.com' ||
    origin === 'https://www.fnaticpair.com' ||
    origin === 'http://localhost:3000' ||
    origin === 'http://localhost:5173' ||
    origin === 'http://localhost:8080' ||
    /\.vercel\.app$/.test(origin)
  );
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    json(res, 405, { message: 'Method not allowed.' });
    return;
  }

  const origin = req.headers.origin || '';
  const allowedOrigins = (process.env.CONTACT_ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (!isAllowedOrigin(origin, allowedOrigins)) {
    json(res, 403, { message: 'Forbidden origin.' });
    return;
  }

  let body = {};

  try {
    body =
      req.body && typeof req.body === 'object'
        ? req.body
        : typeof req.body === 'string'
          ? JSON.parse(req.body || '{}')
          : {};
  } catch (error) {
    json(res, 400, { message: '잘못된 요청 형식입니다.' });
    return;
  }

  const name = normalizeText(body.name, 40);
  const phone = normalizeText(body.phone, 30);
  const email = normalizeText(body.email, 120);
  const category = normalizeText(body.category, 80) || '일반 문의';
  const message = normalizeText(body.message, 2000);
  const website = normalizeText(body.website, 200);
  const startedAt = Number(body.startedAt);

  if (website) {
    json(res, 200, { message: '문의가 접수되었습니다.' });
    return;
  }

  if (!name || !phone || !message) {
    json(res, 400, { message: '필수 항목을 입력해 주세요.' });
    return;
  }

  if (Number.isFinite(startedAt) && Date.now() - startedAt < 3000) {
    json(res, 429, { message: '전송이 너무 빨라서 차단되었습니다. 잠시 후 다시 시도해 주세요.' });
    return;
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const contactToEmail = process.env.CONTACT_TO_EMAIL;
  const contactFromEmail = process.env.CONTACT_FROM_EMAIL;
  const subjectPrefix = process.env.CONTACT_SUBJECT_PREFIX || '[FnaticPair 문의]';

  if (!resendApiKey || !contactToEmail || !contactFromEmail) {
    json(res, 500, { message: '문의 폼이 아직 설정되지 않았습니다. 잠시 후 다시 시도해 주세요.' });
    return;
  }

  const ipAddressHeader = req.headers['x-forwarded-for'];
  const ipAddress = Array.isArray(ipAddressHeader)
    ? ipAddressHeader[0]
    : typeof ipAddressHeader === 'string'
      ? ipAddressHeader.split(',')[0].trim()
      : 'unknown';

  const subject = `${subjectPrefix} ${category}`;
  const text = [
    'FnaticPair 문의가 접수되었습니다.',
    '',
    `이름: ${name}`,
    `연락처: ${phone}`,
    `이메일: ${email || '(미입력)'}`,
    `문의 유형: ${category}`,
    `접수 시각: ${new Date().toISOString()}`,
    `Origin: ${origin || 'unknown'}`,
    `IP: ${ipAddress}`,
    '',
    '[문의 내용]',
    message
  ].join('\n');

  const emailPayload = {
    from: contactFromEmail,
    to: [contactToEmail],
    subject,
    text
  };

  if (email) {
    emailPayload.reply_to = email;
  }

  try {
    const resendResponse = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error('Resend API error:', resendResponse.status, errorText);
      json(res, 502, { message: '메일 전송 서비스와 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.' });
      return;
    }

    json(res, 200, { message: '문의가 접수되었습니다. 확인 후 빠르게 연락드릴게요.' });
  } catch (error) {
    console.error('Contact API error:', error);
    json(res, 500, { message: '문의 전송 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' });
  }
};
