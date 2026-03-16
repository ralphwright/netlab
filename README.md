# NetLab — Interactive Network Engineering Labs

A full-stack application for learning network engineering through hands-on, interactive labs with simulated Cisco IOS CLI, D3-powered topology visualizations, and PostgreSQL-backed progress tracking.

![Stack](https://img.shields.io/badge/React-18-61DAFB?logo=react) ![Stack](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi) ![Stack](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql) ![Stack](https://img.shields.io/badge/D3.js-7-F9A03C?logo=d3.js) ![Stack](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)

---

## 🎯 What's Included

### 22 Individual Topic Labs

| # | Topic | Difficulty | Description |
|---|-------|-----------|-------------|
| 1 | **VLANs** | Beginner | Create VLANs, assign access/trunk ports, verify with `show vlan brief` |
| 2 | **STP** | Beginner | Root bridge election, PortFast, BPDU Guard, port states |
| 3 | **OSPF** | Intermediate | Single-area OSPF, neighbor adjacencies, LSDB, shortest-path |
| 4 | **LACP/EtherChannel** | Intermediate | Port-channel bundling with LACP, load balancing, failover |
| 5 | **DHCP** | Beginner | DHCP server pools, excluded addresses, relay agents |
| 6 | **DNS** | Beginner | DNS records, forward/reverse lookup, client configuration |
| 7 | **BGP** | Advanced | eBGP peering, prefix advertisement, route-maps, path selection |
| 8 | **MPLS** | Advanced | Label switching, LIB/LFIB, PHP behavior, label paths |
| 9 | **Network Tunneling** | Intermediate | GRE, IPsec, VXLAN comparison, tunnel encapsulation |
| 10 | **GRE Tunnels** | Intermediate | Point-to-point GRE, tunnel interfaces, OSPF over GRE |
| 11 | **Autonomous Systems** | Advanced | ASN structure, iBGP/eBGP, prefix propagation |
| 12 | **IPv6** | Intermediate | Global unicast, OSPFv3, dual-stack, NDP/SLAAC |
| 13 | **Remote Access** | Advanced | Site-to-site VPN, IPsec parameters, crypto maps |
| 14 | **SSH** | Beginner | RSA keys, VTY line security, SSH-only access |
| 15 | **ACLs** | Intermediate | Standard/extended ACLs, permit/deny, troubleshooting |
| 16 | **NAT** | Intermediate | Static NAT, dynamic NAT pools, translation tables |
| 17 | **PAT** | Intermediate | Interface overload, port translations, outbound connectivity |
| 18 | **Wireless APs** | Beginner | SSIDs, channels, power levels, client association |
| 19 | **Wireless Controllers** | Intermediate | WLC registration, WLAN creation, AP groups |
| 20 | **Wireless Security** | Advanced | WPA2/WPA3-Enterprise, 802.1X, RADIUS, rogue detection |
| 21 | **Wireless Topology** | Intermediate | Site surveys, AP placement, mesh vs autonomous, roaming |
| 22 | **Firewalls** | Advanced | Zone-based policies, zone pairs, class-maps, inspection |

### 1 Capstone Integration Lab

**Enterprise Network: Full Integration Lab** (Expert, ~120 min)

Builds a complete multi-site enterprise network integrating ALL 22 topics:
- **Phase 1**: Campus LAN — VLANs, STP, LACP trunks
- **Phase 2**: Routing — OSPF, GRE tunnels, OSPF over GRE
- **Phase 3**: WAN — BGP to ISP, MPLS label switching
- **Phase 4**: Services — IPv6 dual-stack, DHCP, DNS
- **Phase 5**: Security — NAT/PAT, ACLs
- **Phase 6**: Perimeter — Firewalls, SSH-only management
- **Phase 7**: Wireless — AP deployment, WLC, WPA3
- **Phase 8**: Remote access — IPsec VPN
- **Phase 9**: End-to-end verification

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React + D3    │────▶│    FastAPI       │────▶│   PostgreSQL    │
│   Frontend      │     │    Backend       │     │   Database      │
│   :3000         │     │    :8000         │     │   :5432         │
└─────────────────┘     └─────────────────┘     └─────────────────┘
       Vite                  Uvicorn                 16-alpine
   React Router           SQLAlchemy Async
   D3.js Topology         CLI Simulator
   Terminal Emulator      Command Validation
```

### Key Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Topology Canvas** | D3.js | Interactive SVG network diagrams with click-to-select devices |
| **Terminal Emulator** | React | Simulated Cisco IOS CLI with syntax highlighting, tab-complete, history |
| **CLI Engine** | FastAPI/Python | Command parsing, IOS output simulation, step validation |
| **Step System** | React + PostgreSQL | Guided instructions, hints, explanations, progress tracking |
| **Progress Tracker** | PostgreSQL | Per-user lab completion, points, achievements |

---

## 🚀 Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed

### Launch

```bash
# Clone or extract the project
cd netlab

# Start all services
docker compose up --build

# Wait for all 3 services to start:
#   netlab-db   → PostgreSQL ready
#   netlab-api  → Uvicorn running on :8000
#   netlab-ui   → Vite dev server on :3000
```

Then open **http://localhost:3000** in your browser.

### Verify Services

```bash
# API health check
curl http://localhost:8000/health

# List all labs
curl http://localhost:8000/api/labs/

# Get lab detail
curl http://localhost:8000/api/labs/vlan-fundamentals

# Get topology
curl http://localhost:8000/api/topology/vlan-fundamentals
```

### Stop

```bash
docker compose down           # Stop containers
docker compose down -v        # Stop + delete database volume
```

---

## 📂 Project Structure

```
netlab/
├── docker-compose.yml          # Orchestration
├── README.md
│
├── db/
│   ├── init.sql                # Schema: tables, enums, views
│   └── seed.sql                # 22 topics, 23 labs, devices, steps, achievements
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py             # FastAPI app with CORS
│       ├── database.py         # Async SQLAlchemy engine
│       └── routers/
│           ├── labs.py         # GET /api/labs/, /api/labs/{slug}
│           ├── topology.py     # GET /api/topology/{slug}
│           ├── cli.py          # POST /api/cli/execute, /validate-step
│           └── progress.py     # GET/POST /api/progress/
│
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── api.js              # API client
        ├── styles/
        │   └── global.css      # Design system
        └── components/
            ├── Dashboard.jsx       # Lab catalog with filters
            ├── LabView.jsx         # Lab workspace layout
            ├── TopologyGraph.jsx   # D3 interactive topology
            ├── TerminalEmulator.jsx # CLI with syntax highlighting
            └── StepPanel.jsx       # Step instructions & hints
```

---

## 🔌 API Reference

### Labs
- `GET /api/labs/` — List all labs with topics, step counts, points
- `GET /api/labs/topics` — List all 22 topics
- `GET /api/labs/{slug}` — Full lab detail with steps

### Topology
- `GET /api/topology/{slug}` — Devices, interfaces, links for D3 rendering

### CLI
- `POST /api/cli/execute` — Execute a command, get simulated IOS output
- `POST /api/cli/validate-step` — Check if all step commands are entered

### Progress
- `GET /api/progress/{username}` — User's lab progress
- `POST /api/progress/update` — Update step/points progress
- `GET /api/progress/{username}/achievements` — Earned badges

---

## 🛠️ Development

### Backend only
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend only
```bash
cd frontend
npm install
npm run dev
```

### Database
```bash
# Connect to running PostgreSQL
docker exec -it netlab-db psql -U netlab

# Useful queries
SELECT * FROM lab_overview;
SELECT * FROM devices WHERE lab_id = (SELECT id FROM labs WHERE slug = 'full-enterprise-network');
SELECT * FROM lab_steps WHERE lab_id = (SELECT id FROM labs WHERE slug = 'vlan-fundamentals') ORDER BY step_number;
```

---

## 🧩 Extending

### Add a New Lab

1. Insert into `labs` table in `seed.sql`
2. Link to topics via `lab_topics`
3. Add devices to `devices` table
4. Add interfaces and links
5. Add guided steps to `lab_steps`
6. Add show command outputs to `cli.py` SHOW_OUTPUTS dict

### Add New Show Commands

Edit `backend/app/routers/cli.py` — add entries to the `SHOW_OUTPUTS` dictionary with device-specific or default output strings.

---

## License

Educational use. Built for hands-on network engineering training.
