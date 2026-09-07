const { jetnetRequest, cached } = require('./lib/jetnet');
const { json, handleOptions } = require('./lib/http');

function firstOfMonthMonthsAgo(n) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - n);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${mm}/01/${d.getFullYear()}`;
}

// GET /.netlify/functions/market-trends?modelid=40&months=12
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' });

  const params = event.queryStringParameters || {};
  const modelid = parseInt(params.modelid || '', 10);
  if (!modelid) return json(400, { error: 'modelid je obavezan parametar' });

  const months = Math.min(parseInt(params.months || '12', 10) || 12, 60);

  try {
    const data = await cached(`market-trends-${modelid}-${months}`, 60 * 60 * 1000, () =>
      jetnetRequest('/api/Model/getModelMarketTrends/{apiToken}', {
        method: 'POST',
        body: {
          airframetype: 'None',
          maketype: 'None',
          productcode: ['None'],
          modelid: 0,
          make: '',
          modlist: [modelid],
          displayRange: months,
          startdate: firstOfMonthMonthsAgo(months),
        },
      })
    );

    const trends = (data.modelMarketTrends || []).sort(
      (a, b) => a.trend_year - b.trend_year || a.trend_month - b.trend_month
    );

    return json(200, { trends });
  } catch (err) {
    return json(502, { error: err.message });
  }
};
