import api from './api';

export const searchProducts = async (params = {}) => {
  try {
    console.log('Search request params:', params);
    
    // Prepare query parameters
    const queryParams = new URLSearchParams();
    if (params.search?.trim()) queryParams.append('search', params.search.trim());
    if (params.category) queryParams.append('category', params.category.toLowerCase());
    if (params.minPrice) queryParams.append('minPrice', params.minPrice);
    if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice);
    if (params.sort) queryParams.append('sort', params.sort);

    // Send search request
    const response = await api.get(`/products?${queryParams.toString()}`);
    
    if (response.data) {
      console.log('Search response:', {
        total: response.data.length,
        params: Object.fromEntries(queryParams.entries())
      });
      return response.data;
    }

    return [];
  } catch (error) {
    console.error('Error searching products:', error.response?.data || error.message);
    throw new Error('Failed to fetch products. Please try again.');
  }
}; 