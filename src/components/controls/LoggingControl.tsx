import React from 'react';
import logger from '../../lib/utils/logging';

interface LoggingControlProps {
  className?: string;
}

export const LoggingControl: React.FC<LoggingControlProps> = ({ className = '' }) => {
  const [isVerbose, setIsVerbose] = React.useState(false);

  const handleVerboseToggle = () => {
    const newValue = !isVerbose;
    setIsVerbose(newValue);
    logger.setVerbose(newValue);
  };

  const handleDownloadLogs = async () => {
    await logger.saveLogs();
  };

  const handleClearLogs = () => {
    logger.clearLogs();
  };

  return (
    <div className={`absolute bottom-4 right-4 bg-white p-2 rounded shadow-md ${className}`}>
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isVerbose}
            onChange={handleVerboseToggle}
            className="form-checkbox h-4 w-4"
          />
          Verbose Logging
        </label>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadLogs}
            className="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Download Logs
          </button>
          <button
            onClick={handleClearLogs}
            className="px-2 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Clear Logs
          </button>
        </div>
      </div>
    </div>
  );
};
