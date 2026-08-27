type LoginResponse = {
  token: string;
  refreshToken: string;
};

type TelemetryEntry = {
  ts: number;
  value: string;
};

type LatestTelemetry = Record<string, TelemetryEntry[]>;

const {
  THINGSBOARD_URL,
  THINGSBOARD_USERNAME,
  THINGSBOARD_PASSWORD,
  THINGSBOARD_DEVICE_ID,
} = process.env;

if (
  !THINGSBOARD_URL ||
  !THINGSBOARD_USERNAME ||
  !THINGSBOARD_PASSWORD ||
  !THINGSBOARD_DEVICE_ID
) {
  throw new Error("Missing ThingsBoard environment variables");
}

let cachedToken: string | null = null;

async function getAuthToken(): Promise<string> {
  if (cachedToken) {
    return cachedToken;
  }

  const response = await fetch(`${THINGSBOARD_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: THINGSBOARD_USERNAME,
      password: THINGSBOARD_PASSWORD,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `ThingsBoard login failed: ${response.status} ${await response.text()}`,
    );
  }

  const result = (await response.json()) as LoginResponse;
  cachedToken = result.token;

  return result.token;
}

async function tbFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = await getAuthToken();

  const response = await fetch(`${THINGSBOARD_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Authorization": `Bearer ${token}`,
      ...init.headers,
    },
  });

  if (response.status === 401) {
    cachedToken = null;

    const refreshedToken = await getAuthToken();

    return fetch(`${THINGSBOARD_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "X-Authorization": `Bearer ${refreshedToken}`,
        ...init.headers,
      },
    });
  }

  return response;
}

export async function getHomeStatus(): Promise<{
  roomTemperature: number | null;
  lightState: boolean | null;
  blindPosition: number | null;
}> {
  const keys = ["roomTemperature", "lightState", "blindPosition"].join(",");

  const response = await tbFetch(
    `/api/plugins/telemetry/DEVICE/${THINGSBOARD_DEVICE_ID}/values/timeseries?keys=${keys}`,
  );

  if (!response.ok) {
    throw new Error(
      `Reading telemetry failed: ${response.status} ${await response.text()}`,
    );
  }

  const telemetry = (await response.json()) as LatestTelemetry;

  const temperatureValue = telemetry.roomTemperature?.[0]?.value;
  const lightValue = telemetry.lightState?.[0]?.value;
  const blindValue = telemetry.blindPosition?.[0]?.value;

  return {
    roomTemperature:
      temperatureValue !== undefined ? Number(temperatureValue) : null,

    lightState:
      lightValue !== undefined
        ? ["true", "1", "on"].includes(lightValue.toLowerCase())
        : null,

    blindPosition:
      blindValue !== undefined ? Number(blindValue) : null,
  };
}

export async function setLight(state: boolean): Promise<void> {
  const response = await tbFetch(
    `/api/rpc/oneway/${THINGSBOARD_DEVICE_ID}`,
    {
      method: "POST",
      body: JSON.stringify({
        method: "setLight",
        params: state,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Light RPC failed: ${response.status} ${await response.text()}`,
    );
  }
}