"use client";
import { useEffect, useState } from "react";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

interface Reading {
    time: string;
    value: number;
}

interface TemperatureSensorData {
    timestamp: string;
    value: number;
}

interface TemperatureAlert {
    message: string;
    temperature: number;
    sensorName: string;
    timestamp: string;
    severity: 'critical' | 'warning';
}

export default function DashboardTemp() {
    const [readings, setReadings] = useState<Reading[]>([]);
    const [loading, setLoading] = useState(true);
    const [alerts, setAlerts] = useState<TemperatureAlert[]>([]);
    const [sseStatus, setSseStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    useEffect(() => {
        async function fetchData() {
            try {
                if (!apiUrl) {
                    setLoading(false);
                    throw new Error("API URL is not set");
                }

                const res = await fetch(`${apiUrl}/temperature-sensors`);
                if (!res.ok) throw new Error("Error fetching data");

                const data: TemperatureSensorData[] = await res.json();
                const formatted = data.map((item) => ({
                    time: new Date(item.timestamp).toLocaleTimeString("uk-UA", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                    }),
                    value: item.value,
                }));
                setReadings(formatted);
            } catch (error) {
                console.error("Fetching data:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();

        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, [apiUrl]);

    useEffect(() => {
        if (!apiUrl) {
            console.warn('[Temperature] API URL not set');
            return;
        }

        const url = `${apiUrl}/temperature-sensors/alerts`;
        console.log('[Temperature] Connecting to SSE:', url);
        setSseStatus('connecting');

        const eventSource = new EventSource(url, { withCredentials: true });

        eventSource.onopen = () => {
            console.log('[Temperature] SSE connection established');
            setSseStatus('connected');
        };

        eventSource.onmessage = (event) => {
            console.log('[Temperature] Alert received:', event.data);
            try {
                const alert: TemperatureAlert = JSON.parse(event.data);
                console.log('[Temperature] Alert parsed:', alert);
                setAlerts((prev) => [alert, ...prev].slice(0, 5));
            } catch (e) {
                console.error('[Temperature] Failed to parse alert:', e);
            }
        };

        eventSource.onerror = (error) => {
            console.error('[Temperature] SSE Error:', error);
            console.error('[Temperature] ReadyState:', eventSource.readyState);
            setSseStatus('error');
            eventSource.close();
        };

        return () => {
            console.log('[Temperature] Closing SSE connection');
            eventSource.close();
        };
    }, [apiUrl]);

    if (loading) return <p>Завантаження даних...</p>;

    return (
        <div className="w-full p-4 bg-white rounded shadow">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">Температура</h3>
                <div className="flex items-center gap-2 text-sm">
                    <div
                        className={`w-2 h-2 rounded-full ${
                            sseStatus === 'connected'
                                ? 'bg-green-500'
                                : sseStatus === 'connecting'
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                        }`}
                    ></div>
                    <span className="text-gray-600">
                        SSE: {sseStatus === 'connected' ? '✓ Connected' : sseStatus === 'connecting' ? '⟳ Connecting' : '✗ Error'}
                    </span>
                </div>
            </div>
            
            {alerts.length > 0 && (
                <div className="space-y-2 mb-4">
                    {alerts.map((alert, index) => (
                        <div
                            key={index}
                            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md"
                            role="alert"
                        >
                            <p className="font-bold">⚠ {alert.message}</p>
                            <p className="text-sm">
                                Давач: {alert.sensorName} | Час:{" "}
                                {new Date(alert.timestamp).toLocaleTimeString("uk-UA")}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            <div className="w-full h-72 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={readings} margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" label="time"/>
                        <YAxis
                            label={{ value: "Celsius", angle: -90, position: "insideLeft" }}
                            domain={['auto', 'auto']}
                        />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="#8884d8" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
