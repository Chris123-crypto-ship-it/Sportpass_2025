// Zentrale Fehlerbehandlung
export class AppError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export function handleApiError(res, error) {
  console.error('API-Fehler:', error);
  
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: error.message,
      code: error.code
    });
  }
  
  // Supabase-Fehler
  if (error?.code && error?.message) {
    return res.status(500).json({
      error: error.message,
      code: error.code
    });
  }
  
  // Standard-Fehler
  return res.status(500).json({
    error: 'Ein unerwarteter Fehler ist aufgetreten',
    code: 'INTERNAL_SERVER_ERROR'
  });
} 