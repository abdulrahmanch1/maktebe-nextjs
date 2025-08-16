import { useState, useEffect } from 'react';
import axios from 'axios';

const useFetch = (url, dependencies = [], config = {}, shouldFetch = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      if (!url || !shouldFetch) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(url, { ...config, signal: controller.signal });
        setData(response);
      } catch (err) {
        if (err.name !== 'CanceledError') {
          if (err.response && err.response.data && err.response.data.message) {
            setError({ message: err.response.data.message });
          } else {
            setError({ message: err.message || 'An unknown error occurred' });
          }
        }
      }
      setLoading(false);
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, [url, shouldFetch, ...dependencies, config]);

  return { data, loading, error };
};

export default useFetch;