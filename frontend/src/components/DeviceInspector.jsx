import React from 'react';
import { X, Cpu, Network, GitBranch } from 'lucide-react';

const DEVICE_TYPE_LABELS = {
  router:              'Router',
  switch:              'Layer 2 Switch',
  l3_switch:           'Layer 3 Switch',
  firewall:            'Firewall',
  server:              'Server',
  workstation:         'Workstation',
  wireless_ap:         'Wireless AP',
  wireless_controller: 'Wireless Controller',
  cloud:               'Cloud / ISP',
  internet:            'Internet',
  dns_server:          'DNS Server',
  dhcp_server:         'DHCP Server',
};

export default function DeviceInspector({ deviceName, topology, onClose }) {
  if (!deviceName || !topology) return null;

  const device     = topology.devices?.find((d) => d.name === deviceName);
  const interfaces = topology.interfaces?.filter((i) => i.device_id === device?.id) || [];
  const links      = topology.links || [];

  // Find connected devices for each interface
  const getConnectedDevice = (ifaceId) => {
    const link = links.find((l) => l.source_if_id === ifaceId || l.target_if_id === ifaceId);
    if (!link) return null;
    const otherIfId = link.source_if_id === ifaceId ? link.target_if_id : link.source_if_id;
    const otherIf   = topology.interfaces?.find((i) => i.id === otherIfId);
    const otherDev  = topology.devices?.find((d) => d.id === otherIf?.device_id);
    return otherDev ? { device: otherDev.name, iface: otherIf?.short_name || otherIf?.name, link_type: link.link_type } : null;
  };

  if (!device) return null;

  const typeLabel = DEVICE_TYPE_LABELS[device.device_type] || device.device_type;

  return (
    <div className="device-inspector">
      <div className="device-inspector-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Cpu size={14} style={{ color: 'var(--accent)' }} />
          <span className="device-inspector-name">{device.name}</span>
          <span className="device-inspector-type">{typeLabel}</span>
          {device.model && (
            <span className="device-inspector-model">{device.model}</span>
          )}
        </div>
        <button className="device-inspector-close" onClick={onClose} title="Close inspector">
          <X size={14} />
        </button>
      </div>

      <div className="device-inspector-body">
        {/* Interfaces table */}
        {interfaces.length > 0 ? (
          <div className="device-inspector-section">
            <div className="device-inspector-section-title">
              <Network size={11} /> Interfaces
            </div>
            <table className="device-inspector-table">
              <thead>
                <tr>
                  <th>Interface</th>
                  <th>IP / Mask</th>
                  <th>VLAN</th>
                  <th>Status</th>
                  <th>Connected To</th>
                </tr>
              </thead>
              <tbody>
                {interfaces.map((iface) => {
                  const conn = getConnectedDevice(iface.id);
                  const ip   = iface.ip_address
                    ? `${iface.ip_address}${iface.subnet_mask ? '/' + maskToCidr(iface.subnet_mask) : ''}`
                    : '—';
                  return (
                    <tr key={iface.id}>
                      <td className="device-inspector-ifname">{iface.short_name || iface.name}</td>
                      <td className="device-inspector-ip">{ip}</td>
                      <td>
                        {iface.vlan_id ? (
                          <span className="device-inspector-vlan">
                            {iface.is_trunk ? 'T:' : ''}{iface.vlan_id}
                          </span>
                        ) : '—'}
                      </td>
                      <td>
                        <span className={`device-inspector-status ${iface.status === 'up' ? 'up' : 'down'}`}>
                          {iface.status || 'up'}
                        </span>
                      </td>
                      <td className="device-inspector-conn">
                        {conn ? (
                          <>
                            <GitBranch size={10} style={{ verticalAlign: -1, marginRight: 3 }} />
                            {conn.device} {conn.iface ? `(${conn.iface})` : ''}
                            {conn.link_type === 'trunk' && <span className="device-inspector-badge">trunk</span>}
                            {conn.link_type === 'tunnel' && <span className="device-inspector-badge tunnel">tunnel</span>}
                          </>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', padding: '4px 0' }}>
            No interface data available for this device.
          </div>
        )}
      </div>
    </div>
  );
}

// Convert dotted subnet mask to CIDR prefix length
function maskToCidr(mask) {
  if (!mask || mask.startsWith('/')) return mask?.replace('/', '') || '';
  if (/^\d+$/.test(mask)) return mask; // already CIDR
  return mask.split('.').reduce((acc, octet) => {
    let n = parseInt(octet, 10);
    let bits = 0;
    while (n > 0) { bits += n & 1; n >>= 1; }
    return acc + bits;
  }, 0).toString();
}
