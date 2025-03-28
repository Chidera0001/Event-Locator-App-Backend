const axios = require('axios');
const logger = require('../config/logger');

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

const MapsService = {
  async geocodeAddress(address) {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json`,
        {
          params: {
            address,
            key: GOOGLE_MAPS_API_KEY
          }
        }
      );

      if (response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location;
        return {
          latitude: location.lat,
          longitude: location.lng,
          formattedAddress: response.data.results[0].formatted_address
        };
      }
      return null;
    } catch (error) {
      logger.error('Geocoding error:', error);
      throw new Error('Geocoding failed');
    }
  },

  async getStaticMapUrl(latitude, longitude, zoom = 15) {
    return `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=${zoom}&size=600x300&markers=color:red%7C${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;
  },

  async calculateDistance(origin, destination) {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/distancematrix/json`,
        {
          params: {
            origins: `${origin.latitude},${origin.longitude}`,
            destinations: `${destination.latitude},${destination.longitude}`,
            key: GOOGLE_MAPS_API_KEY
          }
        }
      );

      if (response.data.rows[0].elements[0].status === 'OK') {
        return {
          distance: response.data.rows[0].elements[0].distance,
          duration: response.data.rows[0].elements[0].duration
        };
      }
      return null;
    } catch (error) {
      logger.error('Distance calculation error:', error);
      throw new Error('Distance calculation failed');
    }
  }
};

module.exports = MapsService; 