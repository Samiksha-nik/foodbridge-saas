const axios = require("axios");

async function geocodeAddress(address) {
  if (!address) return { lat: null, lng: null };

  try {
    const url = "https://nominatim.openstreetmap.org/search";

    const response = await axios.get(url, {
      params: {
        q: address,
        format: "json",
        limit: 1,
      },
      headers: {
        "User-Agent": "foodbridge-app",
      },
    });

    if (!response.data || response.data.length === 0) {
      return { lat: null, lng: null };
    }

    return {
      lat: parseFloat(response.data[0].lat),
      lng: parseFloat(response.data[0].lon),
    };
  } catch (err) {
    console.error("Geocoding error:", err.message);
    return { lat: null, lng: null };
  }
}

module.exports = geocodeAddress;

