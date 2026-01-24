import React, { useEffect, useState } from 'react';

function ProductInfo() {
  const [version, setVersion] = useState<string>('0.0.1Beta');
  const [buildId] = useState<string>('33edc5a3-34e9-4085-b8d1-9afc4376cc81');

  useEffect(() => {
    // Try to get version from Electron
    window.electron
      ?.getAppVersion?.()
      .then((v) => setVersion(v))
      .catch(() => {
        // Fallback to default if Electron API not available
        console.log('Using default version');
      });
  }, []);

  return (
    <div className="px-3 py-2">
      <span className="text-sm font-medium">JobHive (v{version})</span>
      <p className="text-black/50 dark:text-white/50 text-[10px] font-mono">{buildId}</p>
    </div>
  );
}

export default ProductInfo;
