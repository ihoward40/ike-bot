// Dashboard Routes for SintraPrime

import { Router, Request, Response } from 'express';
import { getSintraPrime } from '../core/sintraPrime';
import { SintraMode } from '../core/types';

const router = Router();

// Dashboard Home - HTML interface
router.get('/', (_req: Request, res: Response) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SintraPrime Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Courier New', monospace; 
            background: #0a0a0a; 
            color: #00ff00;
            padding: 20px;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { 
            font-size: 2.5em; 
            margin-bottom: 10px;
            text-shadow: 0 0 10px #00ff00;
        }
        .status-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 5px;
            font-weight: bold;
            margin-left: 20px;
        }
        .online { background: #00ff00; color: #000; }
        .offline { background: #ff0000; color: #fff; }
        .panel {
            background: #1a1a1a;
            border: 2px solid #00ff00;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            box-shadow: 0 0 20px rgba(0, 255, 0, 0.2);
        }
        .panel h2 {
            color: #00ff00;
            margin-bottom: 15px;
            font-size: 1.5em;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        .info-item {
            background: #0f0f0f;
            padding: 15px;
            border-left: 3px solid #00ff00;
        }
        .info-label {
            color: #00cc00;
            font-size: 0.9em;
            margin-bottom: 5px;
        }
        .info-value {
            color: #00ff00;
            font-size: 1.2em;
            font-weight: bold;
        }
        .event-list {
            max-height: 400px;
            overflow-y: auto;
        }
        .event-item {
            background: #0f0f0f;
            padding: 12px;
            margin: 8px 0;
            border-left: 3px solid #00cc00;
        }
        .event-time {
            color: #00cc00;
            font-size: 0.85em;
        }
        .event-type {
            color: #00ff00;
            font-weight: bold;
            margin: 5px 0;
        }
        .event-data {
            color: #009900;
            font-size: 0.9em;
            margin-top: 5px;
        }
        .mode-buttons {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin-top: 15px;
        }
        .mode-btn {
            padding: 10px 20px;
            background: #00ff00;
            color: #000;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-family: 'Courier New', monospace;
            font-weight: bold;
            transition: all 0.3s;
        }
        .mode-btn:hover {
            background: #00cc00;
            box-shadow: 0 0 10px #00ff00;
        }
        .mode-btn.active {
            background: #fff;
            color: #000;
        }
        .refresh-info {
            color: #00cc00;
            font-size: 0.9em;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>
            SintraPrime Dashboard
            <span class="status-badge" id="status-badge">Loading...</span>
        </h1>
        
        <div class="panel">
            <h2>System Status</h2>
            <div class="info-grid" id="status-grid">
                <div class="info-item">
                    <div class="info-label">MODE</div>
                    <div class="info-value" id="mode">--</div>
                </div>
                <div class="info-item">
                    <div class="info-label">UPTIME</div>
                    <div class="info-value" id="uptime">--</div>
                </div>
                <div class="info-item">
                    <div class="info-label">TIME</div>
                    <div class="info-value" id="time">--</div>
                </div>
                <div class="info-item">
                    <div class="info-label">SESSION ID</div>
                    <div class="info-value" id="session" style="font-size: 0.8em;">--</div>
                </div>
                <div class="info-item">
                    <div class="info-label">EVENTS</div>
                    <div class="info-value" id="events">--</div>
                </div>
                <div class="info-item">
                    <div class="info-label">LAST HEARTBEAT</div>
                    <div class="info-value" id="heartbeat" style="font-size: 0.7em;">--</div>
                </div>
            </div>
        </div>

        <div class="panel">
            <h2>Mode Control</h2>
            <div class="mode-buttons">
                <button class="mode-btn" onclick="setMode('SENTINEL')">SENTINEL</button>
                <button class="mode-btn" onclick="setMode('DISPATCH')">DISPATCH</button>
                <button class="mode-btn" onclick="setMode('FOCUS')">FOCUS</button>
                <button class="mode-btn" onclick="setMode('QUIET')">QUIET</button>
                <button class="mode-btn" onclick="setMode('DEBUG')">DEBUG</button>
            </div>
        </div>

        <div class="panel">
            <h2>Recent Events</h2>
            <div class="event-list" id="event-list">
                <p>Loading events...</p>
            </div>
        </div>

        <p class="refresh-info">⟳ Auto-refreshing every 5 seconds</p>
    </div>

    <script>
        async function updateDashboard() {
            try {
                const response = await fetch('/sintra/api/status');
                const data = await response.json();
                
                // Update status badge
                const badge = document.getElementById('status-badge');
                badge.textContent = data.online ? 'ONLINE' : 'OFFLINE';
                badge.className = 'status-badge ' + (data.online ? 'online' : 'offline');
                
                // Update status fields
                document.getElementById('mode').textContent = data.mode;
                document.getElementById('uptime').textContent = data.uptime;
                document.getElementById('time').textContent = data.time;
                document.getElementById('session').textContent = data.sessionId.substring(0, 13) + '...';
                document.getElementById('events').textContent = data.eventCount;
                document.getElementById('heartbeat').textContent = data.lastHeartbeat;
                
                // Highlight active mode button
                document.querySelectorAll('.mode-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                const activeBtn = document.querySelector(\`.mode-btn[onclick="setMode('\${data.mode}')"]\`);
                if (activeBtn) activeBtn.classList.add('active');
                
            } catch (error) {
                console.error('Error updating dashboard:', error);
            }
        }

        async function updateEvents() {
            try {
                const response = await fetch('/sintra/api/events?count=10');
                const events = await response.json();
                
                const eventList = document.getElementById('event-list');
                
                if (events.length === 0) {
                    eventList.innerHTML = '<p>No events recorded yet.</p>';
                    return;
                }
                
                eventList.innerHTML = events.map(event => {
                    const time = new Date(event.timestamp).toLocaleTimeString();
                    return \`
                        <div class="event-item">
                            <div class="event-time">\${time}</div>
                            <div class="event-type">\${event.type.toUpperCase()} [\${event.mode}]</div>
                            <div class="event-data">\${JSON.stringify(event.data)}</div>
                        </div>
                    \`;
                }).join('');
                
            } catch (error) {
                console.error('Error updating events:', error);
            }
        }

        async function setMode(mode) {
            try {
                await fetch('/sintra/api/mode', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mode })
                });
                await updateDashboard();
            } catch (error) {
                console.error('Error setting mode:', error);
            }
        }

        // Initial load
        updateDashboard();
        updateEvents();
        
        // Auto-refresh
        setInterval(() => {
            updateDashboard();
            updateEvents();
        }, 5000);
    </script>
</body>
</html>
  `;
  
  res.send(html);
});

// API: Get status
router.get('/api/status', (_req: Request, res: Response) => {
  const sintra = getSintraPrime();
  res.json(sintra.getStatus());
});

// API: Get events
router.get('/api/events', (req: Request, res: Response) => {
  const sintra = getSintraPrime();
  const count = parseInt(req.query.count as string) || 10;
  const events = sintra.getRecentEvents(count);
  res.json(events);
});

// API: Set mode
router.post('/api/mode', async (req: Request, res: Response) => {
  const sintra = getSintraPrime();
  const { mode } = req.body;
  
  if (!Object.values(SintraMode).includes(mode)) {
    return res.status(400).json({ error: 'Invalid mode' });
  }
  
  await sintra.setMode(mode as SintraMode);
  res.json({ success: true, mode });
});

// Webhook endpoint for external events
router.post('/event', (req: Request, res: Response) => {
  const sintra = getSintraPrime();
  const { type, data } = req.body;
  
  if (!type) {
    return res.status(400).json({ error: 'Event type required' });
  }
  
  sintra.recordEvent(type, data || {});
  res.json({ success: true, message: 'Event recorded' });
});

export default router;
