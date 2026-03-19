import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { useTheme } from '../useTheme';

const DEVICE_ICONS = {
  router: { symbol: '⬡', label: 'R', color: '#2979ff' },
  switch: { symbol: '◇', label: 'SW', color: '#7c4dff' },
  l3_switch: { symbol: '◇', label: 'L3', color: '#00c853' },
  firewall: { symbol: '⬢', label: 'FW', color: '#ff1744' },
  server: { symbol: '▣', label: 'SRV', color: '#00bcd4' },
  workstation: { symbol: '▢', label: 'PC', color: '#78909c' },
  wireless_ap: { symbol: '◉', label: 'AP', color: '#039be5' },
  wireless_controller: { symbol: '◎', label: 'WLC', color: '#0277bd' },
  cloud: { symbol: '☁', label: 'NET', color: '#546e7a' },
  internet: { symbol: '☁', label: 'WAN', color: '#455a64' },
  dns_server: { symbol: '▣', label: 'DNS', color: '#0891b2' },
  dhcp_server: { symbol: '▣', label: 'DHCP', color: '#dc2626' },
};

export default function TopologyGraph({ topology, selectedDevice, onDeviceSelect, currentStep }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 320 });
  const { theme } = useTheme();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      const isMobile = w < 500;
      setDimensions({
        width: w,
        height: isMobile
          ? Math.max(180, Math.min(250, w * 0.5))
          : Math.max(280, Math.min(400, w * 0.35)),
      });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || !topology) return;

    const { width, height } = dimensions;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const devices = topology.devices || [];
    if (devices.length === 0) return;

    // Read theme colors from CSS variables
    const cs = getComputedStyle(document.documentElement);
    const c = (v) => cs.getPropertyValue(v).trim();
    const topoBg = c('--topo-bg') || '#080c14';
    const topoGrid = c('--topo-grid') || '#1e2a3e';
    const topoLink = c('--topo-link') || '#253148';
    const topoNodeBg = c('--topo-node-bg') || 'rgba(20,28,43,0.9)';
    const topoNodeSelBg = c('--topo-node-selected-bg') || 'rgba(0,229,255,0.12)';
    const topoLabel = c('--topo-label') || '#8b9ab8';
    const topoLabelSel = c('--topo-label-selected') || '#e8edf5';
    const topoSublabel = c('--topo-sublabel') || '#5a6b87';
    const accent = c('--accent') || '#00e5ff';

    // Compute layout positions
    const isMobile = width < 500;
    const padding = isMobile ? 35 : 60;
    const xExtent = d3.extent(devices, (d) => d.x_pos || 0);
    const yExtent = d3.extent(devices, (d) => d.y_pos || 0);
    const xScale = d3.scaleLinear()
      .domain([xExtent[0] - 50, xExtent[1] + 50])
      .range([padding, width - padding]);
    const yScale = d3.scaleLinear()
      .domain([yExtent[0] - 50, yExtent[1] + 50])
      .range([padding, height - padding]);

    const nodes = devices.map((d) => ({
      ...d,
      x: xScale(d.x_pos || 0),
      y: yScale(d.y_pos || 0),
    }));

    const nodeMap = {};
    nodes.forEach((n) => { nodeMap[n.id] = n; nodeMap[n.name] = n; });

    // Defs — filters and gradients
    const defs = svg.append('defs');

    // Glow filter
    const glow = defs.append('filter').attr('id', 'glow');
    glow.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur');
    glow.append('feComposite').attr('in', 'SourceGraphic').attr('in2', 'blur').attr('operator', 'over');

    // Grid pattern
    const gridSize = 30;
    const pattern = defs.append('pattern')
      .attr('id', 'grid')
      .attr('width', gridSize)
      .attr('height', gridSize)
      .attr('patternUnits', 'userSpaceOnUse');
    pattern.append('circle')
      .attr('cx', gridSize / 2)
      .attr('cy', gridSize / 2)
      .attr('r', 0.5)
      .attr('fill', topoGrid);

    // Background
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', topoBg);
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'url(#grid)');

    // Auto-generate links between nearby devices if no links in DB
    let edges = (topology.links || []).map((l) => {
      const src = topology.interfaces?.find((i) => i.id === l.source_if_id);
      const tgt = topology.interfaces?.find((i) => i.id === l.target_if_id);
      const srcDevice = src ? nodes.find((n) => n.id === src.device_id) : null;
      const tgtDevice = tgt ? nodes.find((n) => n.id === tgt.device_id) : null;
      return { source: srcDevice, target: tgtDevice, ...l };
    }).filter((e) => e.source && e.target);

    // If no DB links, infer reasonable connections
    if (edges.length === 0 && nodes.length > 1) {
      const sorted = [...nodes].sort((a, b) => a.x - b.x || a.y - b.y);
      for (let i = 0; i < sorted.length - 1; i++) {
        const a = sorted[i];
        const b = sorted[i + 1];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < width * 0.5) {
          edges.push({ source: a, target: b, link_type: 'ethernet' });
        }
      }
      // Connect separated clusters
      const routers = nodes.filter((n) => ['router', 'firewall', 'cloud', 'internet'].includes(n.device_type));
      for (let i = 0; i < routers.length - 1; i++) {
        if (!edges.find((e) =>
          (e.source.id === routers[i].id && e.target.id === routers[i + 1].id) ||
          (e.target.id === routers[i].id && e.source.id === routers[i + 1].id)
        )) {
          edges.push({ source: routers[i], target: routers[i + 1], link_type: 'serial' });
        }
      }
    }

    // Draw links
    const linkGroup = svg.append('g').attr('class', 'links');
    edges.forEach((edge) => {
      if (!edge.source || !edge.target) return;
      const isTunnel = edge.link_type === 'tunnel';
      const isWireless = edge.link_type === 'wireless';

      linkGroup.append('line')
        .attr('x1', edge.source.x)
        .attr('y1', edge.source.y)
        .attr('x2', edge.target.x)
        .attr('y2', edge.target.y)
        .attr('stroke', isTunnel ? '#76ff03' : isWireless ? '#039be5' : topoLink)
        .attr('stroke-width', isMobile ? 1 : (isTunnel ? 1.5 : 2))
        .attr('stroke-dasharray', isTunnel ? '6,4' : isWireless ? '3,3' : 'none')
        .attr('opacity', 0.7);
    });

    // Draw highlight for target device
    const targetDevice = currentStep?.target_device;

    // Device groups
    const deviceGroup = svg.append('g').attr('class', 'devices');

    nodes.forEach((node) => {
      const icon = DEVICE_ICONS[node.device_type] || DEVICE_ICONS.server;
      const isSelected = node.name === selectedDevice;
      const isTarget = node.name === targetDevice;
      const g = deviceGroup.append('g')
        .attr('transform', `translate(${node.x}, ${node.y})`)
        .attr('cursor', 'pointer')
        .on('click', () => onDeviceSelect(node.name));

      // Selection ring
      if (isSelected) {
        g.append('circle')
          .attr('r', isMobile ? 22 : 30)
          .attr('fill', 'none')
          .attr('stroke', accent)
          .attr('stroke-width', isMobile ? 1.5 : 2)
          .attr('stroke-dasharray', '4,3')
          .attr('filter', 'url(#glow)')
          .attr('opacity', 0.8);
      }

      // Target pulse
      if (isTarget && !isSelected) {
        g.append('circle')
          .attr('r', isMobile ? 20 : 28)
          .attr('fill', 'none')
          .attr('stroke', '#ffab00')
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '3,3')
          .attr('opacity', 0.6);
      }

      // Device body
      const bodySize = isMobile ? 16 : 22;
      g.append('rect')
        .attr('x', -bodySize)
        .attr('y', -bodySize)
        .attr('width', bodySize * 2)
        .attr('height', bodySize * 2)
        .attr('rx', node.device_type === 'router' ? bodySize : node.device_type === 'cloud' || node.device_type === 'internet' ? (isMobile ? 8 : 12) : (isMobile ? 4 : 6))
        .attr('fill', isSelected ? topoNodeSelBg : topoNodeBg)
        .attr('stroke', isSelected ? accent : icon.color)
        .attr('stroke-width', isSelected ? 2 : 1.5);

      // Icon label
      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('fill', isSelected ? accent : icon.color)
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('font-size', isMobile ? '9px' : '11px')
        .attr('font-weight', '600')
        .text(icon.label);

      // Device name
      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', bodySize + (isMobile ? 12 : 16))
        .attr('fill', isSelected ? topoLabelSel : topoLabel)
        .attr('font-family', 'IBM Plex Sans, sans-serif')
        .attr('font-size', isMobile ? '8px' : '11px')
        .attr('font-weight', isSelected ? '600' : '400')
        .text(node.name);

      // Model subtitle
      if (node.model && !isMobile) {
        g.append('text')
          .attr('text-anchor', 'middle')
          .attr('y', bodySize + 30)
          .attr('fill', topoSublabel)
          .attr('font-family', 'IBM Plex Sans, sans-serif')
          .attr('font-size', '9px')
          .text(node.model);
      }

      // Hover effect
      g.on('mouseenter', function () {
        d3.select(this).select('rect')
          .transition().duration(150)
          .attr('stroke-width', 2.5)
          .attr('fill', topoNodeSelBg);
      }).on('mouseleave', function () {
        if (node.name !== selectedDevice) {
          d3.select(this).select('rect')
            .transition().duration(150)
            .attr('stroke-width', 1.5)
            .attr('fill', topoNodeBg);
        }
      });
    });

  }, [topology, selectedDevice, dimensions, currentStep, onDeviceSelect, theme]);

  return (
    <div ref={containerRef} className="topology-container">
      <div className="topology-header" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 12px', background: 'var(--bg-panel)', borderBottom: '1px solid var(--border-subtle)'
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
          TOPOLOGY — Tap a device for CLI
        </span>
        {selectedDevice && (
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
            color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4
          }}>
            Selected: <strong>{selectedDevice}</strong>
          </span>
        )}
      </div>
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      />
    </div>
  );
}
