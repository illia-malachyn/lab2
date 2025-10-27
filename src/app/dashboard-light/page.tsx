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

export default function DashboardLight() {
    const [readings, setReadings] = useState<Reading[]>([]);
    const [loading, setLoading] = useState(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch(`${apiUrl}/lightsensors`);
                if (!res.ok) throw new Error("Error fetching data");

                const data = await res.json();
                const formatted = data.map((item: any) => ({
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

    if (loading) return <p>Завантаження даних...</p>;

    return (
        <div className="w-full h-96">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={readings}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#ffc658" />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}