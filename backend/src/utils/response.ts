/**
 * Respuesta estándar del API
 */
export function successResponse<T>(data: T, message: string = 'Operación exitosa') {
  return {
    success: true,
    message,
    data,
  };
}

/**
 * Respuesta estándar con paginación
 */
export function successResponseWithPagination<T>(
  data: T,
  skip: number,
  take: number,
  total: number,
  message: string = 'Operación exitosa'
) {
  return {
    success: true,
    message,
    data,
    pagination: {
      skip,
      take,
      total,
    },
  };
}

/**
 * Respuesta de error
 */
export function errorResponse(message: string, statusCode: number = 400) {
  return {
    statusCode,
    body: {
      success: false,
      message,
    },
  };
}
