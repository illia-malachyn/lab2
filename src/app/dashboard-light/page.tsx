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

interface LightSensorData {
    timestamp: string;
    value: number;
}

interface LightAlert {
    message: string;
    luminosity: number;
    sensorName: string;
    timestamp: string;
    severity: 'critical' | 'warning';
}

export default function DashboardLight() {
    const [readings, setReadings] = useState<Reading[]>([]);
    const [loading, setLoading] = useState(true);
    const [alerts, setAlerts] = useState<LightAlert[]>([]);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    useEffect(() => {
        async function fetchData() {
            try {
                if (!apiUrl) {
                    setLoading(false);
                    throw new Error("API URL is not set");
                }

                const res = await fetch(`${apiUrl}/light-sensors`);
                if (!res.ok) throw new Error("Error fetching data");

                const data: LightSensorData[] = await res.json();
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
        if (!apiUrl) return;

        const eventSource = new EventSource(`${apiUrl}/light-sensors/alerts`);

        eventSource.onmessage = (event) => {
            const alert: LightAlert = JSON.parse(event.data);
            setAlerts((prev) => [alert, ...prev].slice(0, 5));
        };

        eventSource.onerror = (error) => {
            console.error('SSE Error:', error);
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, [apiUrl]);

    if (loading) return <p>Завантаження даних...</p>;

    return (
        <div className="w-full p-4 bg-white rounded shadow">
            <h3 className="text-lg font-semibold">Яскравість світла</h3>
            
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
                            label={{ value: "lux", angle: -90, position: "insideLeft" }}
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