import { useState, useEffect } from 'react';

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set up the timeout
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timeout if value changes or component unmounts
    return () => {
      clearTimeout(timeoutId);
    };
  }, [value, delay]);

  return debouncedValue;
}

export { useDebounce };

//bunu neden kullanıyoruz?

//bu sayede arama yapılırken bir delay ekleyerek performansı artırıyoruz.
//bu sayede her harf girildiğinde arama yapılmasını önleriz.

