import React from "react";

export default function AdsPlaceholder({ id }: { id: string }) {
  return (
    <div className="my-4 rounded bg-gray-100 text-center p-4 text-gray-400">
      Espace Publicité ({id})
    </div>
  );
}
