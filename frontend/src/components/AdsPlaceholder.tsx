import React, { useEffect } from "react";

export default function AdsPlaceholder({ id }: { id: string }) {
  useEffect(() => {
    // Google AdSense script would be loaded here
    // Example: (window.adsbygoogle = window.adsbygoogle || []).push({});
  }, []);

  return (
    <div className="my-8 rounded-lg bg-gray-50 border border-gray-200 text-center p-8 text-gray-400">
      <div className="text-xs uppercase tracking-wide mb-2">Publicité</div>
      <div className="h-20 flex items-center justify-center">
        {/* AdSense ad unit would go here */}
        <ins 
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-XXXXXXXXXX"
          data-ad-slot={id}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}
