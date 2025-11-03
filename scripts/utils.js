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
    return null;
  }
}

export function getQueryParam(param) {
  const params = new URLSearchParams(window.location.search);
  return params.get(param);
}
