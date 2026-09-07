const { jetnetRequest, cached } = require('./lib/jetnet');
const { json, handleOptions } = require('./lib/http');

function fmtDate(d) {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}/${dd}/${d.getFullYear()}`;
}

// GET /.netlify/functions/history?modelid=40&months=12
// Retail, non-internal, non-OEM-new FullSale/Lease transactions only.
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' });

  const params = event.queryStringParameters || {};
  const modelid = parseInt(params.modelid || '', 10);
  if (!modelid) return json(400, { error: 'modelid je obavezan parametar' });

  const months = Math.min(parseInt(params.months || '12', 10) || 12, 36);
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - months);

  try {
    const data = await cached(`history-${modelid}-${months}`, 30 * 60 * 1000, () =>
      jetnetRequest('/api/Aircraft/getHistoryListPaged/{apiToken}/200/1', {
        method: 'POST',
        body: {
          modelid,
          modlist: [modelid],
          transtype: ['FullSale', 'Lease'],
          startdate: fmtDate(start),
          enddate: fmtDate(end),
          isinternaltrans: 'No',
          isnewaircraft: 'No',
          allrelationships: true,
          isretailtrans: 'Yes',
        },
      })
    );

    const transactions = (data.history || []).sort(
      (a, b) => new Date(b.transdate) - new Date(a.transdate)
    );

    return json(200, {
      transactions,
      totalOnPage: data.count || 0,
      totalPages: data.maxpages || 1,
    });
  } catch (err) {
    return json(502, { error: err.message });
  }
};
