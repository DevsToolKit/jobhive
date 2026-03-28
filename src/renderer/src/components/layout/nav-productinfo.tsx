import { useEffect, useState } from 'react';

function ProductInfo() {
  const [version, setVersion] = useState('0.0.0');
  const [buildLabel, setBuildLabel] = useState('desktop');

  useEffect(() => {
    window.app
      .getAppInfo()
      .then((info) => {
        setVersion(info.version);
        setBuildLabel(`${info.platform}${info.isPackaged ? ' / packaged' : ' / dev'}`);
      })
      .catch(() => {
        setBuildLabel('desktop');
      });
  }, []);

  return (
    <div className="px-3 py-2">
      <span className="text-sm font-medium">JobHive (v{version})</span>
      <p className="text-[10px] font-mono text-black/50 dark:text-white/50">{buildLabel}</p>
    </div>
  );
}

export default ProductInfo;
