const { jetnetRequest, cached } = require('./lib/jetnet');
const { json, handleOptions } = require('./lib/http');

// GET /.netlify/functions/aircraft?reg=N29ZR
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' });

  const params = event.queryStringParameters || {};
  const reg = (params.reg || '').trim().toUpperCase();
  if (!reg) return json(400, { error: 'reg je obavezan parametar' });

  try {
    const data = await cached(`aircraft-${reg}`, 10 * 60 * 1000, () =>
      jetnetRequest(`/api/Aircraft/getRegNumber/${encodeURIComponent(reg)}/{apiToken}`, {
        method: 'GET',
      })
    );

    return json(200, { aircraft: data.aircraftresult || null });
  } catch (err) {
    const msg = err.message || 'Lookup failed.';
    const notFound = /NOT FOUND/i.test(msg);
    return json(notFound ? 404 : 502, { error: notFound ? 'No aircraft found for that registration.' : msg });
  }
};
