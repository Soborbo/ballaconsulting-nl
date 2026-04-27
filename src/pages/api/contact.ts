import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { Resend } from 'resend';
import { trackServerError, buildErrorConfig } from '@/lib/errors/tracker-server';

const ALLOWED_ORIGINS = new Set([
  'https://ballaconsulting.com',
  'https://www.ballaconsulting.com',
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME = 200;
const MAX_EMAIL = 320;
const MAX_MESSAGE = 5000;

const FORM_ID = 'contact';
const FUNCTION_PATH = '/api/contact';

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const stripControl = (s: string) => s.replace(/[\x00-\x1f\x7f]/g, ' ').trim();

export const POST: APIRoute = async ({ request }) => {
  const errorConfig = buildErrorConfig(env as unknown as Record<string, string>);

  const origin = request.headers.get('origin');
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    await trackServerError('SRV-CORS-002', null, { origin }, errorConfig);
    return json(403, { error: 'Forbidden origin' });
  }

  const apiKey = (env as unknown as { RESEND_API_KEY?: string }).RESEND_API_KEY;
  if (!apiKey) {
    await trackServerError(
      'SRV-ENV-001',
      new Error('RESEND_API_KEY missing'),
      { varName: 'RESEND_API_KEY', functionPath: FUNCTION_PATH },
      errorConfig,
    );
    return json(500, { error: 'Mail service not configured' });
  }

  let data: unknown;
  try {
    data = await request.json();
  } catch (e) {
    await trackServerError(
      'SRV-PARSE-001',
      e,
      { contentType: request.headers.get('content-type') || 'unknown' },
      errorConfig,
    );
    return json(400, { error: 'Invalid JSON' });
  }

  if (!data || typeof data !== 'object') {
    return json(400, { error: 'Invalid payload' });
  }

  const { name, email, message } = data as Record<string, unknown>;
  if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
    await trackServerError(
      'FORM-ZOD-002',
      null,
      { fieldName: 'name|email|message', formId: FORM_ID },
      errorConfig,
    );
    return json(400, { error: 'All fields are required' });
  }

  const cleanName = stripControl(name).slice(0, MAX_NAME);
  const cleanEmail = email.trim().slice(0, MAX_EMAIL);
  const cleanMessage = message.trim().slice(0, MAX_MESSAGE);

  if (!cleanName || !cleanEmail || !cleanMessage) {
    await trackServerError(
      'FORM-ZOD-002',
      null,
      { fieldName: !cleanName ? 'name' : !cleanEmail ? 'email' : 'message', formId: FORM_ID },
      errorConfig,
    );
    return json(400, { error: 'All fields are required' });
  }
  if (!EMAIL_RE.test(cleanEmail)) {
    await trackServerError(
      'FORM-ZOD-003',
      null,
      { fieldName: 'email', fieldType: 'email' },
      errorConfig,
    );
    return json(400, { error: 'Invalid email address' });
  }

  const resend = new Resend(apiKey);

  try {
    const { error } = await resend.emails.send({
      from: 'Balla Consulting <noreply@ballaconsulting.com>',
      to: 'maria.balla@ballaconsulting.com',
      replyTo: cleanEmail,
      subject: `Contact form: ${cleanName}`,
      text: `Name: ${cleanName}\nEmail: ${cleanEmail}\n\n${cleanMessage}`,
    });
    if (error) {
      await trackServerError(
        'RESEND-PAY-001',
        new Error(error.message || 'Resend returned error'),
        { statusCode: 0, errorBody: (error.message || '').slice(0, 200) },
        errorConfig,
      );
      return json(500, { error: 'Failed to send message' });
    }
  } catch (e) {
    await trackServerError(
      'RESEND-NET-001',
      e,
      { errorMessage: e instanceof Error ? e.message.slice(0, 200) : String(e).slice(0, 200) },
      errorConfig,
    );
    return json(500, { error: 'Failed to send message' });
  }

  return json(200, { success: true });
};
