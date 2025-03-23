import { useState } from 'react';

export function useFormState<T extends Record<string, any>>(initialState: T) {
  const [state, setState] = useState<T>(initialState);

  const handleChange = (field: keyof T) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | number
  ) => {
    const value = typeof e === 'number' ? e : e.target.value;
    setState(prev => ({ ...prev, [field]: value }));
  };

  return {
    state,
    setState,
    handleChange
  };
}