'use client';
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const useFetch = (url, options = undefined, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const serializedDeps = useMemo(() => {
    const safeDeps = Array.isArray(dependencies) ? dependencies : [];
    return JSON.stringify(safeDeps.map((dep) => dep ?? null));
  }, [dependencies]);
  const serializedOptions = useMemo(
    () => (options ? JSON.stringify(options) : null),
    [options]
  );
  const parsedOptions = useMemo(
    () => (serializedOptions ? JSON.parse(serializedOptions) : undefined),
    [serializedOptions]
  );

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
        const response = await axios.get(url, { ...(parsedOptions || {}), signal: controller.signal });
        setData(response.data);
      } catch (err) {
        if (err.name !== 'CanceledError') {
          // Check if it's an Axios error with a response
          if (err.response && err.response.data && err.response.data.message) {
            setError({ message: err.response.data.message }); // Extract message from API response
          } else {
            setError({ message: err.message || 'An unknown error occurred' }); // Fallback
          }
        }
      }
      setLoading(false);
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, [url, serializedDeps, parsedOptions]);

  return { data, loading, error };
};

export default useFetch;
