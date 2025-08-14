/**
 * Safely parse JSON with error handling
 * @param {string} jsonString - The JSON string to parse
 * @param {any} defaultValue - Default value to return if parsing fails
 * @returns {any} - Parsed JSON object or default value
 */
export const safeJsonParse = (jsonString, defaultValue = null) => {
  if (!jsonString || typeof jsonString !== 'string') {
    console.warn('safeJsonParse: Invalid input, expected string but got:', typeof jsonString);
    return defaultValue;
  }
  
  try {
    const trimmed = jsonString.trim();
    if (!trimmed || trimmed === 'undefined' || trimmed === 'null') {
      console.warn('safeJsonParse: Invalid or empty string provided:', trimmed);
      return defaultValue;
    }
    
    return JSON.parse(trimmed);
  } catch (error) {
    console.error('safeJsonParse: JSON parsing failed:', error);
    console.error('Input string:', jsonString);
    return defaultValue;
  }
};

/**
 * Safely stringify object to JSON
 * @param {any} obj - Object to stringify
 * @param {any} defaultValue - Default value to return if stringifying fails
 * @returns {string} - JSON string or default value
 */
export const safeJsonStringify = (obj, defaultValue = '{}') => {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    console.error('safeJsonStringify: JSON stringifying failed:', error);
    console.error('Input object:', obj);
    return defaultValue;
  }
}; 