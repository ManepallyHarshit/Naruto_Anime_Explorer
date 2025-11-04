// Utility functions
export async function fetchData(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`fetchData: non-ok response (${res.status}) for ${url}`);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching data:", error);
    window.location.href = "../404.html";
    return null;
  }
}

// Normalize strings for comparison
export function getQueryParam(param) {
  const params = new URLSearchParams(window.location.search);
  return params.get(param);
}
