const { jetnetRequest, cached } = require('./lib/jetnet');
const { json, handleOptions } = require('./lib/http');

function fmtDate(d) {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}/${dd}/${d.getFullYear()}`;
}

// GET /.netlify/functions/events?modelid=40&days=180
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' });

  const params = event.queryStringParameters || {};
  const modelid = parseInt(params.modelid || '', 10);
  if (!modelid) return json(400, { error: 'modelid je obavezan parametar' });

  const days = Math.min(parseInt(params.days || '180', 10) || 180, 365);
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);

  try {
    const data = await cached(`events-${modelid}-${days}`, 30 * 60 * 1000, () =>
      jetnetRequest('/api/Aircraft/getEventListPaged/{apiToken}/200/1', {
        method: 'POST',
        body: {
          modelid,
          evtype: [],
          evcategory: [],
          startdate: fmtDate(start),
          enddate: fmtDate(end),
          aclist: [],
          modlist: [modelid],
        },
      })
    );

    const events = (data.events || []).sort((a, b) => new Date(b.date) - new Date(a.date));

    return json(200, { events });
  } catch (err) {
    return json(502, { error: err.message });
  }
};
