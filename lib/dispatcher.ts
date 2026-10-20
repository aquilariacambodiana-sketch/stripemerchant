export async function logApiCall(endpoint: string, method: string, request: any, response: any) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        endpoint,
        method,
        request,
        response
    };
    
    // In a production environment, this would send to a logging service (Datadog, Cloud Logging, etc.)
    console.log('[API DISPATCHER LOG]', JSON.stringify(logEntry, null, 2));
}
