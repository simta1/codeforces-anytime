type CodeforcesParams = { [key: string]: string | number | boolean };

interface CodeforcesResponse<T> {
  status: 'OK' | 'FAILED';
  comment?: string;
  result?: T;
}

let nextRequestTime = 0;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const buildQuery = (params: CodeforcesParams) => {
  const query = new URLSearchParams();
  Object.keys(params).forEach((key) => query.append(key, String(params[key])));
  return query.toString();
};

export const fetchCodeforcesAPI = async <T>(
  method: string,
  params: CodeforcesParams = {}
): Promise<T> => {
  const now = Date.now();
  const waitMs = Math.max(0, nextRequestTime - now);
  if (waitMs > 0) {
    await wait(waitMs);
  }
  nextRequestTime = Date.now() + 2100;

  const query = buildQuery(params);
  const url = `https://codeforces.com/api/${method}${query ? `?${query}` : ''}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Codeforces API HTTP ${response.status}`);
  }

  const json = (await response.json()) as CodeforcesResponse<T>;
  if (json.status !== 'OK' || json.result === undefined) {
    throw new Error(json.comment || 'Codeforces API request failed');
  }

  return json.result;
};
