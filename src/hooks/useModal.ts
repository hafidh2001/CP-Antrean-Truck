import { useState } from 'react';

export type TModalProps = {
  toggle: (open?: boolean) => void;
  isShown: boolean;
};

const useModal = (): Pick<TModalProps, 'isShown' | 'toggle'> => {
  const [isShown, setIsShown] = useState<boolean>(false);
  
  /**
   * Toggle modal visibility
   * @param value - Optional boolean value to set the modal state
   * @returns void
   */
  const toggle = (value?: any) =>
    setIsShown((prev) => {
      if (typeof value === 'boolean') {
        return value;
      }
      return !prev;
    });

  return {
    isShown,
    toggle,
  };
};

export default useModal;