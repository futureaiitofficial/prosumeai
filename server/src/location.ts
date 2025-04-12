import axios from 'axios';

export const getUserLocation = async (ip: string) => {
  try {
    const response = await axios.get(`https://ipinfo.io/${ip}/json`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user location:', error);
    throw new Error('Failed to determine user location');
  }
};

// Example usage:
// getUserLocation('8.8.8.8').then(location => console.log(location)); 