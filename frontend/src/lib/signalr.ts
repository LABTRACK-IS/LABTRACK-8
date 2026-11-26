import * as signalR from '@microsoft/signalr';

export interface EnvironmentConfig {
  apiBaseUrl: string;
  aiServiceUrl: string;
  signalRHubUrl: string;
  lanIp: string;
  publicOrigin: string;
  defaultCampus: string;
  heartbeatIntervalMs: number;
  enableDebugLogs: boolean;
  isProduction: boolean;
}

const getEnvVar = (key: string, defaultValue: string = ''): string => {
  if (typeof window !== 'undefined' && (window as any).__ENV__ && (window as any).__ENV__[key]) {
    return (window as any).__ENV__[key];
  }
  return (import.meta.env as any)[key] || defaultValue;
};

const detectedLanIp = typeof __LAN_IP__ !== 'undefined' ? __LAN_IP__ : 'localhost';

const resolveDynamicOrigin = (): string => {
  if (typeof window === 'undefined') return `http://${detectedLanIp}:3000`;
  const { protocol, hostname, port } = window.location;
  const effectiveHost = (hostname === 'localhost' || hostname === '127.0.0.1') && detectedLanIp !== 'localhost'
    ? detectedLanIp
    : hostname;
  return `${protocol}//${effectiveHost}${port ? ':' + port : ''}`;
};

export const env: EnvironmentConfig = {
  // Empty string uses same-origin Vite proxy (/api, /hubs) which works across all LAN devices;
  // falls back to direct port 5000 if VITE_API_BASE_URL is explicitly set.
  apiBaseUrl: getEnvVar('VITE_API_BASE_URL', ''),
  aiServiceUrl: getEnvVar(
    'VITE_AI_SERVICE_URL',
    typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:8000` : 'http://localhost:8000'
  ),
  signalRHubUrl: getEnvVar('VITE_SIGNALR_HUB_URL', '/hubs/labtrack'),
  lanIp: detectedLanIp,
  publicOrigin: resolveDynamicOrigin(),
  defaultCampus: getEnvVar('VITE_DEFAULT_CAMPUS', 'DAPITAN'),
  heartbeatIntervalMs: Number(getEnvVar('VITE_HEARTBEAT_INTERVAL_MS', '30000')),
  enableDebugLogs: getEnvVar('VITE_ENABLE_DEBUG_LOGS', 'false') === 'true',
  isProduction: import.meta.env.PROD,
};

export const SIGNALR_ENDPOINTS = {
  LABTRACK_HUB: '/hubs/labtrack',
  AICHAT_HUB: '/hubs/aichat',
  SESSION_HUB: '/hubs/session',
  TELEMETRY_HUB: '/hubs/labtrack',
  ATTENDANCE_HUB: '/hubs/session',
  ALERT_HUB: '/hubs/labtrack',
} as const;

export type SignalRHubEndpoint = typeof SIGNALR_ENDPOINTS[keyof typeof SIGNALR_ENDPOINTS];

export const resolveSignalRHubUrl = (endpoint: string = SIGNALR_ENDPOINTS.LABTRACK_HUB): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (env.apiBaseUrl) {
    return `${env.apiBaseUrl.replace(/\/+$/, '')}${cleanEndpoint}`;
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${cleanEndpoint}`;
  }
  return `http://localhost:5000${cleanEndpoint}`;
};

export const createSignalRConnection = (
  endpoint: SignalRHubEndpoint | string = SIGNALR_ENDPOINTS.LABTRACK_HUB
): signalR.HubConnection => {
  const hubUrl = resolveSignalRHubUrl(endpoint);

  return new signalR.HubConnectionBuilder()
    .withUrl(hubUrl, {
      accessTokenFactory: () => {
        return (
          sessionStorage.getItem('labtrack_token') ||
          localStorage.getItem('labtrack_token') ||
          localStorage.getItem('jrmsu_labtrack_auth_token') ||
          ''
        );
      },
      transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      skipNegotiation: false,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(env.enableDebugLogs ? signalR.LogLevel.Information : signalR.LogLevel.None)
    .build();
};

export default createSignalRConnection;
