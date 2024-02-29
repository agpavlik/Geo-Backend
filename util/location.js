const axios = require("axios");

const HttpError = require("../models/http-error");

// const API_KEY = "zkTIeufLVykLsdhJiUtvAXqhLyhcwvKR"; // from Google.map.API

// Function takes an address, reaches out to Google's API (alternative - OSM) and converts this address to coordinates.
async function getCoordsForAddress(address) {
  // console.log("address", address);
  const response = await axios.get(
    `https://nominatim.openstreetmap.org/?addressdetails=1&q=${encodeURIComponent(
      address
    )}&format=json&limit=1`
  );
  console.log("response", response);
  const data = response.data;
  console.log("data", data);
  if (!data || data.status === "ZERO_RESULTS") {
    const error = new HttpError(
      "Could not find location for the specified address.",
      422
    );
    throw error;
  }

  const coordinates = {
    lat: data[0]["lat"],
    lng: data[0]["lon"],
  };
  // const coordinates = data.results[0].geometry.location;
  // console.log("coordinates", coordinates)
  return coordinates;
}

module.exports = getCoordsForAddress;
