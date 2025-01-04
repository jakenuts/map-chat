import React, { useState } from 'react';
import { GeoJSONFeature } from '../../lib/types';
import { FileFormat } from '../../lib/services/file';
import { logMessage } from '../../lib/utils/logging';

interface FileControlProps {
  onExport: (format: FileFormat) => void;
  onImport: (format: FileFormat) => void;
  supportedFormats: FileFormat[];
  isLoading: boolean;
}

interface FileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (format: FileFormat) => void;
  title: string;
  formats: FileFormat[];
  isLoading: boolean;
}

const FileDialog: React.FC<FileDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  formats,
  isLoading
}) => {
  const [selectedFormat, setSelectedFormat] = useState<FileFormat>(formats[0]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">{title}</h3>
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Format
          </label>
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value as FileFormat)}
            className="w-full px-3 py-2 border rounded-md"
            disabled={isLoading}
          >
            {formats.map(format => (
              <option key={format} value={format}>
                {format.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400`}
            onClick={() => onConfirm(selectedFormat)}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const FileControl: React.FC<FileControlProps> = ({
  onExport,
  onImport,
  supportedFormats,
  isLoading
}) => {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  const handleExport = (format: FileFormat) => {
    onExport(format);
    setShowExportDialog(false);
    logMessage('map_command', { type: 'export_initiated', format });
  };

  const handleImport = (format: FileFormat) => {
    onImport(format);
    setShowImportDialog(false);
    logMessage('map_command', { type: 'import_initiated', format });
  };

  return (
    <div className="absolute bottom-4 right-4 bg-white p-4 rounded-lg shadow-md">
      <div className="flex space-x-2">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          onClick={() => setShowExportDialog(true)}
          disabled={isLoading}
        >
          Export
        </button>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          onClick={() => setShowImportDialog(true)}
          disabled={isLoading}
        >
          Import
        </button>
      </div>

      <FileDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onConfirm={handleExport}
        title="Export Features"
        formats={supportedFormats}
        isLoading={isLoading}
      />

      <FileDialog
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onConfirm={handleImport}
        title="Import Features"
        formats={supportedFormats}
        isLoading={isLoading}
      />
    </div>
  );
};
