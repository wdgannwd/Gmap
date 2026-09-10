const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  const store = getStore({ name: "consented-locations", consistency: "strong" });
  const adminToken = process.env.ADMIN_TOKEN;

  if (event.httpMethod === "POST") {
    try {
      const body = JSON.parse(event.body || "{}");
      const lat = Number(body.lat), lon = Number(body.lon), accuracy = Number(body.accuracy);
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(accuracy) ||
          lat < -90 || lat > 90 || lon < -180 || lon > 180 || accuracy < 0) {
        return { statusCode: 400, body: "Invalid location data" };
      }
      const item = { lat, lon, accuracy, timestamp: new Date().toISOString() };
      const key = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      await store.setJSON(key, item);
      return { statusCode: 201, body: JSON.stringify({ ok: true }) };
    } catch {
      return { statusCode: 400, body: "Bad request" };
    }
  }

  if (event.httpMethod === "GET") {
    if (!adminToken || event.queryStringParameters?.token !== adminToken)
      return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    const { blobs } = await store.list();
    const out = [];
    for (const b of blobs) {
      const item = await store.get(b.key, { type: "json" });
      if (item) out.push(item);
    }
    out.sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));
    return { statusCode: 200, headers: {"Content-Type":"application/json"}, body: JSON.stringify(out) };
  }
  return { statusCode: 405, body: "Method not allowed" };
};