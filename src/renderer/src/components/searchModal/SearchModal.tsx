import React from 'react';

function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    open && (
      <div
        className="h-screen w-full fixed top-0 left-0 z-100 bg-black/50 flex justify-center items-center"
        onClick={onClose}
      >
        SearchModal
      </div>
    )
  );
}

export default SearchModal;
