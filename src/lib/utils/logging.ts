// Logging utilities for consistent log formatting across the application

type LogType = 'send' | 'receive' | 'error' | 'map_command';

export const logMessage = (type: LogType, data: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${type.toUpperCase()}:`, data);
};

export const logMapCommand = (command: any, success: boolean, error?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] MAP COMMAND ${success ? 'SUCCESS' : 'ERROR'}:`, {
    command,
    ...(error && { error: error.message })
  });
};
