const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  try {
    const adminToken = process.env.ADMIN_TOKEN;

    // Use the older syntax compatible with the installed
    // @netlify/blobs version.
    const store = getStore("consented-locations");

    // -----------------------------
    // RECEIVE A CONSENTED LOCATION
    // -----------------------------
    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");

      const lat = Number(body.lat);
      const lon = Number(body.lon);
      const accuracy = Number(body.accuracy);

      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lon) ||
        !Number.isFinite(accuracy) ||
        lat < -90 ||
        lat > 90 ||
        lon < -180 ||
        lon > 180 ||
        accuracy < 0
      ) {
        return {
          statusCode: 400,
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            error: "Invalid location data"
          })
        };
      }

      const item = {
        lat,
        lon,
        accuracy,
        timestamp: new Date().toISOString()
      };

      const key =
        Date.now().toString() +
        "-" +
        Math.random().toString(36).slice(2);

      await store.setJSON(key, item);

      return {
        statusCode: 201,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ok: true
        })
      };
    }

    // -----------------------------
    // PRIVATE ADMIN DASHBOARD
    // -----------------------------
    if (event.httpMethod === "GET") {

      if (
        !adminToken ||
        event.queryStringParameters?.token !== adminToken
      ) {
        return {
          statusCode: 401,
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            error: "Unauthorized"
          })
        };
      }

      const result = await store.list();

      const locations = [];

      for (const blob of result.blobs || []) {
        const item = await store.get(blob.key, {
          type: "json",
          consistency: "strong"
        });

        if (item) {
          locations.push(item);
        }
      }

      locations.sort(
        (a, b) =>
          new Date(b.timestamp) -
          new Date(a.timestamp)
      );

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(locations)
      };
    }

    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        error: "Method not allowed"
      })
    };

  } catch (error) {

    console.error("Location function error:", error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        error: "Internal server error"
      })
    };
  }
};
