// Vercel serverless function — relays a lead conversion to the OpenAI Conversions API.
//
// The Conversions API key is read from the OAI_CAPI_KEY environment variable (set in the
// Vercel dashboard), so it is NEVER exposed in the website's client-side code.
// The website's form calls POST /api/lead-conversion on submit; this function then fires
// the real server-side event to OpenAI with the secret key.

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const key = process.env.OAI_CAPI_KEY;
  const pid = process.env.OAI_PIXEL_ID || 'SQfyPsQ9WQBDaPqir4NJtx';

  // If the key isn't set yet, succeed quietly so the form UX is never affected.
  if (!key) {
    res.status(200).json({ ok: false, reason: 'not_configured' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  const eventId = String(body.event_id || (Date.now().toString(36) + Math.random().toString(36).slice(2)));
  const ts = Number(body.timestamp_ms) || Date.now();
  const sourceUrl = body.source_url || req.headers.referer || 'https://www.sangeethasabishek.com/';
  const validateOnly = body.validate_only === true; // test the key without recording a conversion

  const payload = {
    validate_only: validateOnly,
    events: [{
      id: eventId,
      type: 'lead_created',
      timestamp_ms: ts,
      source_url: sourceUrl,
      action_source: 'web',
      data: { type: 'customer_action' }
    }]
  };

  const debug = body.debug === true;
  try {
    const r = await fetch('https://bzr.openai.com/v1/events?pid=' + encodeURIComponent(pid), {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    // Never leak the upstream body or key back to the browser (debug only, owner-triggered).
    if (debug) {
      let detail = '';
      try { detail = (await r.text()).slice(0, 500); } catch (e) {}
      res.status(200).json({ ok: r.ok, status: r.status, keyLen: key.length, pid: pid, detail: detail, v: 4 });
      return;
    }
    res.status(200).json({ ok: r.ok });
  } catch (e) {
    res.status(200).json({ ok: false, error: debug ? String(e && e.message || e) : undefined, v: 4 });
  }
};
