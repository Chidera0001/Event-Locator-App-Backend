const MapsService = require('../../src/services/maps.service');
const axios = require('axios');

jest.mock('axios');

describe('MapsService', () => {
  describe('geocodeAddress', () => {
    it('should return coordinates for valid address', async () => {
      const mockResponse = {
        data: {
          results: [
            {
              geometry: {
                location: {
                  lat: 40.7128,
                  lng: -74.0060
                }
              },
              formatted_address: 'New York, NY, USA'
            }
          ]
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await MapsService.geocodeAddress('New York');
      
      expect(result).toEqual({
        latitude: 40.7128,
        longitude: -74.0060,
        formattedAddress: 'New York, NY, USA'
      });
    });
  });

  // Add more test cases...
}); 