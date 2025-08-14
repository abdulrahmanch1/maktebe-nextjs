import { useState, useEffect } from 'react';
import axios from 'axios';

const useFetch = (url, dependencies = [], config = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      if (!url) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(url, { ...config, signal: controller.signal });
        setData(response.data);
      } catch (err) {
        if (err.name !== 'CanceledError') {
          setError(err);
        }
      }
      setLoading(false);
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, [url, ...dependencies, config]);

  return { data, loading, error };
};

export default useFetch;