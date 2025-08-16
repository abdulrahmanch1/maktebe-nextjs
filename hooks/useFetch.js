import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const useFetch = (initialUrl = null, dependencies = [], config = {}, shouldFetch = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [trigger, setTrigger] = useState(0);

  const refetch = useCallback((newUrl = currentUrl) => {
    setCurrentUrl(newUrl);
    setTrigger(prev => prev + 1);
  }, [currentUrl]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      if (!currentUrl || !shouldFetch) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(currentUrl, { ...config, signal: controller.signal });
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
  }, [currentUrl, shouldFetch, trigger, ...dependencies, config]);

  return { data, loading, error, refetch };
};

export default useFetch;