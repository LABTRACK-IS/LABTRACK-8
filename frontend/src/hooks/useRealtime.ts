import { useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { resolveSignalRHubUrl, SIGNALR_ENDPOINTS } from '@/lib/signalr';

export const useRealtime = (onDataUpdate?: () => void, onNotificationUpdate?: () => void) => {
  const callbackRef = useRef({ onDataUpdate, onNotificationUpdate });
  callbackRef.current = { onDataUpdate, onNotificationUpdate };

  useEffect(() => {
    const getToken = () =>
      sessionStorage.getItem('labtrack_token') ||
      localStorage.getItem('labtrack_token') ||
      '';

    const primaryUrl = resolveSignalRHubUrl(SIGNALR_ENDPOINTS.LABTRACK_HUB);
    const directFallbackUrl =
      typeof window !== 'undefined'
        ? `${window.location.protocol}//${window.location.hostname}:5000/hubs/labtrack`
        : 'http://localhost:5000/hubs/labtrack';

    const buildConn = (url: string) =>
      new signalR.HubConnectionBuilder()
        .withUrl(url, {
          accessTokenFactory: getToken,
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.None)
        .build();

    let connection = buildConn(primaryUrl);
    let isDisposed = false;

    const bindEvents = (conn: signalR.HubConnection) => {
      const triggerData = () => callbackRef.current.onDataUpdate?.();
      const triggerNotif = () => {
        callbackRef.current.onNotificationUpdate?.();
        callbackRef.current.onDataUpdate?.();
      };

      conn.on('ReportUpdated', triggerData);
      conn.on('NotificationCreated', triggerNotif);
      conn.on('ReceiveDisruptionAlert', triggerNotif);
      conn.on('ScheduleUpdated', triggerData);
      conn.on('LaboratoryStatusChanged', triggerData);
      conn.on('ReservationUpdated', triggerData);
      conn.on('SessionUpdated', triggerData);
      conn.on('ReceiveSessionUpdate', triggerData);
      conn.on('WorkstationUpdated', triggerData);
    };

    bindEvents(connection);

    connection.start().catch(() => {
      if (isDisposed || primaryUrl === directFallbackUrl) return;
      connection = buildConn(directFallbackUrl);
      bindEvents(connection);
      connection.start().catch(() => {});
    });

    return () => {
      isDisposed = true;
      connection.stop().catch(() => {});
    };
  }, []);
};

export default useRealtime;