/**
 * SSE Connection Tester
 * 
 * Add this to your browser console to test SSE connections
 * Usage: Copy the entire function and paste in browser console
 */

function testSSE(endpoint) {
    console.log(`🔌 Testing SSE connection to: ${endpoint}`);
    
    const es = new EventSource(endpoint);
    let messageCount = 0;
    
    es.onopen = () => {
        console.log('✅ SSE Connection OPENED');
    };
    
    es.onmessage = (event) => {
        messageCount++;
        console.log(`📨 Message #${messageCount}:`, event.data);
        try {
            const data = JSON.parse(event.data);
            console.log('   Parsed data:', data);
        } catch (e) {
            console.log('   ⚠️ Failed to parse JSON:', e.message);
        }
    };
    
    es.onerror = (error) => {
        console.log('❌ SSE Error:', error);
        console.log('   ReadyState:', es.readyState);
        console.log('   (0=CONNECTING, 1=OPEN, 2=CLOSED)');
    };
    
    // Auto-close after 30 seconds for testing
    setTimeout(() => {
        console.log(`⏱️ Test timeout (30s). Received ${messageCount} messages.`);
        es.close();
    }, 30000);
    
    return es;
}

// Usage examples:
// testSSE('http://localhost:3001/temperature-sensors/alerts')
// testSSE('http://localhost:3001/light-sensors/alerts')
// testSSE('http://localhost:3001/humidity-sensors/alerts')
