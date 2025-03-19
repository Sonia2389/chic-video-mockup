
// Update this URL to point to the mockify API service
export const API_URL = process.env.NODE_ENV === 'production' 
  ? "https://mockify.onrender.com/api/render"  // Use mockify.onrender.com for production
  : "https://mockify.onrender.com/api/render";  // Use mockify.onrender.com for development

// A flag to track if we've shown the API connection error already
export let apiErrorShown = false;

export const setApiErrorShown = (value: boolean): void => {
  apiErrorShown = value;
};
