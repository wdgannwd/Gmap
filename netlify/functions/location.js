const {
  connectLambda,
  getStore
} = require("@netlify/blobs");

exports.handler = async (event) => {
  try {
    // Initialize Netlify Blobs for Lambda-compatible Functions
    connectLambda(event);

    const adminToken = process.env.ADMIN_TOKEN;

    // Open the site-wide Netlify Blobs store
    const store = getStore("consented-locations");

    // ==========================================
    // POST — SAVE A CONSENTED LOCATION
    // ==========================================
    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");

      const lat = Number(body.lat);
      const lon = Number(body.lon);
      const accuracy = Number(body.accuracy);

      // Validate location data
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

      // Location record
      const item = {
        lat: lat,
        lon: lon,
        accuracy: accuracy,
        timestamp: new Date().toISOString()
      };

      // Create a unique key
      const key =
        Date.now().toString() +
        "-" +
        Math.random().toString(36).slice(2);

      // Save to Netlify Blobs
      await store.setJSON(key, item);

      console.log("Location saved successfully:", key);

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

    // ==========================================
    // GET — READ LOCATIONS FOR ADMIN
    // ==========================================
    if (event.httpMethod === "GET") {

      // Check admin token
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

      // List all stored location records
      const result = await store.list();

      const locations = [];

      for (const blob of result.blobs || []) {

        // IMPORTANT:
        // Do NOT use consistency: "strong" here.
        // Strong consistency requires additional
        // Netlify Blobs edge configuration.
        const item = await store.get(blob.key, {
          type: "json"
        });

        if (item) {
          locations.push(item);
        }
      }

      // Newest first
      locations.sort(
        (a, b) =>
          new Date(b.timestamp) -
          new Date(a.timestamp)
      );

      console.log(
        `Returning ${locations.length} location record(s)`
      );

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(locations)
      };
    }

    // ==========================================
    // OTHER HTTP METHODS
    // ==========================================
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

    console.error(
      "Location function error:",
      error
    );

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
