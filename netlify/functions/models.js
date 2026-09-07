const { jetnetRequest, cached } = require('./lib/jetnet');
const { json, handleOptions } = require('./lib/http');

// GET /.netlify/functions/models?q=citation&limit=15
// Backs the widget's model search/autocomplete box.
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions();
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' });

  try {
    const params = event.queryStringParameters || {};
    const q = (params.q || '').trim().toLowerCase();
    const limit = Math.min(parseInt(params.limit || '15', 10) || 15, 50);

    // Full model catalog is stable; refresh once a day instead of per keystroke.
    const data = await cached('model-list-all', 24 * 60 * 60 * 1000, () =>
      jetnetRequest('/api/Utility/getAircraftModelList/{apiToken}', {
        method: 'POST',
        body: { airframetype: 'None', maketype: 'None', make: '' },
      })
    );

    let models = data.modellist || [];
    if (q) {
      models = models.filter((m) =>
        `${m.make || ''} ${m.model || ''} ${m.modelicao || ''}`.toLowerCase().includes(q)
      );
    }

    models = models.slice(0, limit).map((m) => ({
      modelid: m.modelid,
      make: m.make,
      model: m.model,
      manufacturer: m.manufacturer,
      categorysize: m.categorysize,
      weightclass: m.weightclass,
    }));

    return json(200, { models });
  } catch (err) {
    return json(502, { error: err.message });
  }
};
