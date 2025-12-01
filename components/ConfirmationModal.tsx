import React, { useEffect } from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
}) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4 animate-fade-in-fast"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-slate-800 rounded-lg shadow-xl w-full max-w-md border border-slate-700"
        role="document"
      >
        <div className="p-6">
          <h2 id="modal-title" className="text-xl font-bold text-slate-200">
            {title}
          </h2>
          <div className="mt-4">{children}</div>
        </div>
        <div className="bg-slate-900/50 px-6 py-4 flex justify-end space-x-3 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-2 px-4 rounded-md transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all duration-300 ease-in-out"
          >
            Confirm & Proceed
          </button>
        </div>
      </div>
    </div>
  );
};