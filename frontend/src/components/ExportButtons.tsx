import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { useWalletStore } from "../store/useWalletStore";

interface ExportButtonsProps {
  onExportPDF: () => void;
  onExportCSV: () => void;
  pdfCredits?: number;
  disabled?: boolean;
}

export default function ExportButtons({ 
  onExportPDF, 
  onExportCSV, 
  pdfCredits = 1,
  disabled = false 
}: ExportButtonsProps) {
  const { credits } = useWalletStore();
  
  return (
    <div className="flex gap-2">
      <button
        onClick={onExportCSV}
        disabled={disabled}
        className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 disabled:bg-gray-100 disabled:text-gray-400"
      >
        <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
        CSV
      </button>
      <button
        onClick={onExportPDF}
        disabled={disabled || credits < pdfCredits}
        className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400"
      >
        <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
        PDF ({pdfCredits} crédit{pdfCredits > 1 ? 's' : ''})
      </button>
    </div>
  );
}