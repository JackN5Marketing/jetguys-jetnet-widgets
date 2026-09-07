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
    // getRegNumber's only real failure mode in practice is "that
    // registration doesn't resolve" (invalid, deregistered, mistyped) --
    // JETNET reports it as an ERROR responsestatus, sometimes alongside a
    // non-2xx HTTP status. Treat all of it as a plain not-found for the widget.
    return json(404, { error: 'No aircraft found for that registration. Double-check the tail number.' });
  }
};
