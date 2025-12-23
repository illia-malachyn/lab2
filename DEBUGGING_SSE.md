# SSE Alerts Debugging Guide

## Quick Diagnostics

### 1. Check Browser Console
When you load a dashboard, open the browser's Developer Tools (F12) and go to the **Console** tab. You should see logs like:

```
[Temperature] Connecting to SSE: http://localhost:3000/temperature-sensors/alerts
[Temperature] SSE connection established
```

**If you don't see these logs:**
- The API URL might not be set correctly
- Check `NEXT_PUBLIC_API_URL` environment variable

### 2. Check SSE Connection Status
Each dashboard now shows a **status indicator** in the top-right corner:
- 🟢 **Green (Connected)** - SSE connection is active and ready
- 🟡 **Yellow (Connecting)** - Connection is establishing
- 🔴 **Red (Error)** - Connection failed

**If status is RED:**
- Check the backend is running and the SSE endpoint exists
- Check the Network tab in DevTools - look for a request to `/temperature-sensors/alerts` (or `/light-sensors/alerts`, `/humidity-sensors/alerts`)
- The request should be of type `eventsource`
- Status should be `200 OK` with `Content-Type: text/event-stream`

### 3. Monitor Network Activity
Open **DevTools → Network tab** and:
1. Filter by "eventsource" or "fetch"
2. Look for these requests:
   - `GET /temperature-sensors/alerts`
   - `GET /light-sensors/alerts`
   - `GET /humidity-sensors/alerts`

**These should:**
- Have status `200`
- Stay open (not closed)
- Show `Content-Type: text/event-stream` header

### 4. Test SSE Manually
In the browser console, test if the SSE endpoint is accessible:

```javascript
const es = new EventSource('http://YOUR_API_URL/temperature-sensors/alerts');
es.onopen = () => console.log('SSE Connected!');
es.onmessage = (e) => console.log('Alert:', e.data);
es.onerror = (e) => console.log('Error:', e);
```

### 5. Console Messages When Alert Arrives
When a critical temperature event is sent from the backend, you should see:

```
[Temperature] Alert received: {"message":"Critical temperature!...","temperature":-15,"sensorName":"Sensor 1",...}
[Temperature] Alert parsed: {message: "Critical temperature!...", temperature: -15, ...}
```

**If you don't see this, the backend is not emitting alerts.**

## Common Issues

### Issue: "API URL not set"
- Solution: Ensure `NEXT_PUBLIC_API_URL` environment variable is set
- Check `.env.local` file exists with the variable

### Issue: SSE status is RED but chart data updates
- The regular REST API works, but SSE endpoint doesn't exist
- Check backend has the `@Sse('alerts')` endpoint implemented

### Issue: SSE connects but no alerts appear
- Check the backend is actually emitting alerts (calling `emitAlert()`)
- Verify the critical value threshold is being met
- Check data is being sent to the API endpoint correctly

### Issue: "Failed to parse alert"
- The backend is sending data in the wrong format
- Check the alert data matches the expected interface
- Verify JSON serialization on the backend

## Testing Checklist

- [ ] SSE status indicator shows GREEN
- [ ] Browser console shows "SSE connection established"
- [ ] Network tab shows eventsource request with status 200
- [ ] Network tab shows event stream data flowing (look for "data: {...}")
- [ ] When critical data is sent, console shows alert received and parsed logs
- [ ] Alert appears in the UI with red background

## Backend Checklist

Make sure these are implemented on the backend:

1. ✅ `TemperatureAlertsService` with `getAlertStream()` method
2. ✅ `@Sse('alerts')` endpoint in controller
3. ✅ Alert emission when critical value detected
4. ✅ Service is registered in module `providers`
5. ✅ Critical threshold check in `create()` method
6. ✅ `emitAlert()` is called after successful save

Example backend flow:
```
1. Send data via POST to /temperature-sensors
2. Data saved to DB
3. Check if value <= -10°C
4. If critical: call alertsService.emitAlert()
5. SSE endpoint sends alert to connected clients
6. Client receives and displays alert
```
