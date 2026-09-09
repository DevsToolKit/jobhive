import { useEffect, useState } from 'react';

function ProductInfo() {
  const [version, setVersion] = useState('0.0.0');

  useEffect(() => {
    if (window.app?.getAppInfo) {
      window.app
        .getAppInfo()
        .then((info) => {
          setVersion(info.version);
        })
        .catch(() => {
          // Keep default
        });
    }
  }, []);

  return (
    <div className="px-1 text-[11px] text-muted-foreground/50 select-none">
      JobHive v{version}
    </div>
  );
}

export default ProductInfo;

