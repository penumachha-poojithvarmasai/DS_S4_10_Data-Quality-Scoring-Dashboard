import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchSampleDataset = async (domain) => {
  const response = await api.get(`/sample/${domain}`);
  return response.data;
};

export const uploadDatasetFile = async (file, domain = 'general') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('domain', domain);

  const response = await axios.post('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const fetchScoreMetrics = async (payload) => {
  const response = await api.post('/score', payload);
  return response.data;
};

export const fetchIssues = async (payload) => {
  const response = await api.post('/issues', payload);
  return response.data;
};

export const compareDatasets = async (formDataOrJson) => {
  if (formDataOrJson instanceof FormData) {
    const response = await axios.post('/api/compare', formDataOrJson, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
  const response = await api.post('/compare', formDataOrJson);
  return response.data;
};

export const remediateDataset = async (payload) => {
  const response = await api.post('/remediate', payload);
  return response.data;
};

export default api;
