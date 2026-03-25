import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { useTheme } from '../useTheme';

const DEVICE_ICONS = {
  router:              { symbol: '⬡', label: 'R',    color: '#2979ff' },
  switch:              { symbol: '◇', label: 'SW',   color: '#7c4dff' },
  l3_switch:           { symbol: '◇', label: 'L3',   color: '#00c853' },
  firewall:            { symbol: '⬢', label: 'FW',   color: '#ff1744' },
  server:              { symbol: '▣', label: 'SRV',  color: '#00bcd4' },
  workstation:         { symbol: '▢', label: 'PC',   color: '#78909c' },
  wireless_ap:         { symbol: '◉', label: 'AP',   color: '#039be5' },
  wireless_controller: { symbol: '◎', label: 'WLC',  color: '#0277bd' },
  cloud:               { symbol: '☁', label: 'NET',  color: '#546e7a' },
  internet:            { symbol: '☁', label: 'WAN',  color: '#455a64' },
  dns_server:          { symbol: '▣', label: 'DNS',  color: '#0891b2' },
  dhcp_server:         { symbol: '▣', label: 'DHCP', color: '#dc2626' },
};

const ANIM_DURATIONS = { 1: 1800, 2: 900, 3: 400 };

export default function TopologyGraph({
  topology,
  selectedDevice,
  onDeviceSelect,
  currentStep,
  packetFlows = [],
  animationSpeed = 2,
}) {
  const svgRef       = useRef(null);
  const containerRef = useRef(null);
  const nodePosRef   = useRef({});
  const nodeMapRef   = useRef({});
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

    const cs = getComputedStyle(document.documentElement);
    const c  = (v) => cs.getPropertyValue(v).trim();
    const topoBg       = c('--topo-bg')              || '#080c14';
    const topoGrid     = c('--topo-grid')             || '#1e2a3e';
    const topoLink     = c('--topo-link')             || '#253148';
    const topoNodeBg   = c('--topo-node-bg')          || 'rgba(20,28,43,0.9)';
    const topoNodeSel  = c('--topo-node-selected-bg') || 'rgba(0,229,255,0.12)';
    const topoLabel    = c('--topo-label')            || '#8b9ab8';
    const topoLabelSel = c('--topo-label-selected')   || '#e8edf5';
    const topoSublabel = c('--topo-sublabel')         || '#5a6b87';
    const accent       = c('--accent')                || '#00e5ff';

    const isMobile = width < 500;
    const padding  = isMobile ? 35 : 60;
    const xExtent  = d3.extent(devices, (d) => d.x_pos || 0);
    const yExtent  = d3.extent(devices, (d) => d.y_pos || 0);
    const xScale   = d3.scaleLinear()
      .domain([xExtent[0] - 50, xExtent[1] + 50]).range([padding, width - padding]);
    const yScale   = d3.scaleLinear()
      .domain([yExtent[0] - 50, yExtent[1] + 50]).range([padding, height - padding]);

    const nodes = devices.map((d) => ({
      ...d,
      x: nodePosRef.current[d.id]?.x ?? xScale(d.x_pos || 0),
      y: nodePosRef.current[d.id]?.y ?? yScale(d.y_pos || 0),
    }));

    nodeMapRef.current = {};
    nodes.forEach((n) => { nodeMapRef.current[n.name] = { x: n.x, y: n.y }; });

    // Defs
    const defs = svg.append('defs');
    const glow = defs.append('filter').attr('id', 'topo-glow');
    glow.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur');
    glow.append('feComposite').attr('in', 'SourceGraphic').attr('in2', 'blur').attr('operator', 'over');

    const gridSize = 30;
    const pattern = defs.append('pattern')
      .attr('id', 'topo-grid-pat').attr('width', gridSize).attr('height', gridSize)
      .attr('patternUnits', 'userSpaceOnUse');
    pattern.append('circle')
      .attr('cx', gridSize / 2).attr('cy', gridSize / 2).attr('r', 0.5).attr('fill', topoGrid);

    svg.append('rect').attr('width', width).attr('height', height).attr('fill', topoBg);
    svg.append('rect').attr('width', width).attr('height', height).attr('fill', 'url(#topo-grid-pat)');

    // Packet animation layer (drawn under nodes)
    svg.append('g').attr('class', 'anim-layer');

    // Edges
    let edges = (topology.links || []).map((l) => {
      const src = topology.interfaces?.find((i) => i.id === l.source_if_id);
      const tgt = topology.interfaces?.find((i) => i.id === l.target_if_id);
      const srcDev = src ? nodes.find((n) => n.id === src.device_id) : null;
      const tgtDev = tgt ? nodes.find((n) => n.id === tgt.device_id) : null;
      return { source: srcDev, target: tgtDev, ...l };
    }).filter((e) => e.source && e.target);

    if (edges.length === 0 && nodes.length > 1) {
      const sorted = [...nodes].sort((a, b) => a.x - b.x || a.y - b.y);
      for (let i = 0; i < sorted.length - 1; i++) {
        const a = sorted[i], b = sorted[i + 1];
        if (Math.hypot(a.x - b.x, a.y - b.y) < width * 0.5)
          edges.push({ source: a, target: b, link_type: 'ethernet' });
      }
      const routers = nodes.filter((n) => ['router', 'firewall', 'cloud', 'internet'].includes(n.device_type));
      for (let i = 0; i < routers.length - 1; i++) {
        const already = edges.find((e) =>
          (e.source.id === routers[i].id && e.target.id === routers[i + 1].id) ||
          (e.target.id === routers[i].id && e.source.id === routers[i + 1].id));
        if (!already) edges.push({ source: routers[i], target: routers[i + 1], link_type: 'serial' });
      }
    }

    const linkGroup = svg.append('g').attr('class', 'links');
    edges.forEach((edge) => {
      if (!edge.source || !edge.target) return;
      const isTunnel   = edge.link_type === 'tunnel';
      const isWireless = edge.link_type === 'wireless';
      const isActive   = currentStep?.target_device &&
        (edge.source.name === currentStep.target_device || edge.target.name === currentStep.target_device);

      linkGroup.append('line')
        .attr('data-src', edge.source.name)
        .attr('data-tgt', edge.target.name)
        .attr('x1', edge.source.x).attr('y1', edge.source.y)
        .attr('x2', edge.target.x).attr('y2', edge.target.y)
        .attr('stroke', isTunnel ? '#76ff03' : isWireless ? '#039be5' : isActive ? accent : topoLink)
        .attr('stroke-width', isMobile ? 1 : (isActive ? 2.5 : isTunnel ? 1.5 : 2))
        .attr('stroke-dasharray', isTunnel ? '6,4' : isWireless ? '3,3' : 'none')
        .attr('opacity', isActive ? 0.9 : 0.7);
    });

    const targetDevice = currentStep?.target_device;
    const deviceGroup  = svg.append('g').attr('class', 'devices');

    nodes.forEach((node) => {
      const icon       = DEVICE_ICONS[node.device_type] || DEVICE_ICONS.server;
      const isSelected = node.name === selectedDevice;
      const isTarget   = node.name === targetDevice;
      const bodySize   = isMobile ? 16 : 22;

      const g = deviceGroup.append('g')
        .attr('class', 'device-node')
        .attr('data-name', node.name)
        .attr('data-id', String(node.id))
        .attr('transform', `translate(${node.x}, ${node.y})`)
        .attr('cursor', 'grab');

      if (isSelected) {
        g.append('circle')
          .attr('r', isMobile ? 22 : 30).attr('fill', 'none')
          .attr('stroke', accent).attr('stroke-width', isMobile ? 1.5 : 2)
          .attr('stroke-dasharray', '4,3').attr('filter', 'url(#topo-glow)').attr('opacity', 0.8);
      }

      if (isTarget && !isSelected) {
        g.append('circle')
          .attr('r', isMobile ? 20 : 28).attr('fill', 'none')
          .attr('stroke', '#ffab00').attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '3,3').attr('opacity', 0.6);
      }

      g.append('rect')
        .attr('x', -bodySize).attr('y', -bodySize)
        .attr('width', bodySize * 2).attr('height', bodySize * 2)
        .attr('rx', node.device_type === 'router' ? bodySize
          : ['cloud', 'internet'].includes(node.device_type) ? (isMobile ? 8 : 12)
          : (isMobile ? 4 : 6))
        .attr('fill',   isSelected ? topoNodeSel : topoNodeBg)
        .attr('stroke', isSelected ? accent : icon.color)
        .attr('stroke-width', isSelected ? 2 : 1.5);

      g.append('text')
        .attr('text-anchor', 'middle').attr('dy', '0.35em')
        .attr('fill', isSelected ? accent : icon.color)
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('font-size', isMobile ? '9px' : '11px').attr('font-weight', '600')
        .attr('pointer-events', 'none').text(icon.label);

      g.append('text')
        .attr('text-anchor', 'middle').attr('y', bodySize + (isMobile ? 12 : 16))
        .attr('fill', isSelected ? topoLabelSel : topoLabel)
        .attr('font-family', 'IBM Plex Sans, sans-serif')
        .attr('font-size', isMobile ? '8px' : '11px')
        .attr('font-weight', isSelected ? '600' : '400')
        .attr('pointer-events', 'none').text(node.name);

      if (node.model && !isMobile) {
        g.append('text')
          .attr('text-anchor', 'middle').attr('y', bodySize + 30)
          .attr('fill', topoSublabel)
          .attr('font-family', 'IBM Plex Sans, sans-serif')
          .attr('font-size', '9px').attr('pointer-events', 'none').text(node.model);
      }

      g.on('click', (event) => {
        event.stopPropagation();
        onDeviceSelect(node.name);
      });

      g.on('mouseenter', function () {
        if (node.name !== selectedDevice) {
          d3.select(this).select('rect').transition().duration(120)
            .attr('stroke-width', 2.5).attr('fill', topoNodeSel);
        }
      }).on('mouseleave', function () {
        if (node.name !== selectedDevice) {
          d3.select(this).select('rect').transition().duration(120)
            .attr('stroke-width', 1.5).attr('fill', topoNodeBg);
        }
      });

      // Drag
      const drag = d3.drag()
        .on('start', function () {
          d3.select(this).attr('cursor', 'grabbing').raise();
        })
        .on('drag', function (event) {
          const nx = event.x, ny = event.y;
          nodePosRef.current[node.id] = { x: nx, y: ny };
          nodeMapRef.current[node.name] = { x: nx, y: ny };
          d3.select(this).attr('transform', `translate(${nx}, ${ny})`);
          svg.selectAll(`line[data-src="${node.name}"]`).attr('x1', nx).attr('y1', ny);
          svg.selectAll(`line[data-tgt="${node.name}"]`).attr('x2', nx).attr('y2', ny);
        })
        .on('end', function () {
          d3.select(this).attr('cursor', 'grab');
        });

      g.call(drag);
    });

    // ── Zoom / pan (mouse + touch pinch) ──────────────────────
    const zoomLayer = svg.append('g').attr('class', 'zoom-layer');

    // Move all previously appended children into the zoom layer
    // by re-appending in order: background, grid, anim-layer, links, devices
    const children = [];
    svg.selectAll(':scope > *').each(function() { if (this !== zoomLayer.node()) children.push(this); });
    children.forEach((child) => zoomLayer.append(() => child));

    const zoom = d3.zoom()
      .scaleExtent([0.4, 3])
      .on('zoom', (event) => {
        zoomLayer.attr('transform', event.transform);
      });

    svg.call(zoom).on('dblclick.zoom', null); // disable double-click zoom

    // Reset zoom on topology change
    svg.call(zoom.transform, d3.zoomIdentity);

  }, [topology, selectedDevice, dimensions, currentStep, onDeviceSelect, theme]);

  // Packet animation effect
  useEffect(() => {
    if (!svgRef.current || !packetFlows.length) return;

    const svg   = d3.select(svgRef.current);
    const layer = svg.select('.anim-layer');
    if (layer.empty()) return;

    layer.selectAll('*').remove();

    const duration = ANIM_DURATIONS[animationSpeed] ?? 900;

    packetFlows.forEach((flow, idx) => {
      const src = nodeMapRef.current[flow.source];
      const tgt = nodeMapRef.current[flow.target];
      if (!src || !tgt) return;

      const delay  = idx * Math.round(duration * 0.15);
      const pColor = flow.color || '#00e5ff';
      const pLabel = flow.label || flow.protocol || '';

      const g = layer.append('g').attr('class', 'packet-particle').attr('opacity', 0);

      g.append('line')
        .attr('x1', src.x).attr('y1', src.y)
        .attr('x2', src.x).attr('y2', src.y)
        .attr('stroke', pColor).attr('stroke-width', 1.5)
        .attr('opacity', 0.35).attr('stroke-dasharray', '4,3');

      g.append('circle')
        .attr('cx', src.x).attr('cy', src.y)
        .attr('r', 6).attr('fill', pColor).attr('filter', 'url(#topo-glow)');

      g.append('text')
        .attr('x', src.x).attr('y', src.y - 13)
        .attr('text-anchor', 'middle').attr('fill', pColor)
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('font-size', '9px').attr('font-weight', '600')
        .attr('pointer-events', 'none').text(pLabel);

      g.transition().delay(delay).duration(80).attr('opacity', 1);

      g.select('circle').transition()
        .delay(delay + 80).duration(duration).ease(d3.easeLinear)
        .attr('cx', tgt.x).attr('cy', tgt.y);

      g.select('text').transition()
        .delay(delay + 80).duration(duration).ease(d3.easeLinear)
        .attr('x', tgt.x).attr('y', tgt.y - 13);

      g.select('line').transition()
        .delay(delay + 80).duration(duration).ease(d3.easeLinear)
        .attr('x2', tgt.x).attr('y2', tgt.y);

      g.transition()
        .delay(delay + 80 + duration).duration(350).attr('opacity', 0)
        .on('end', function () { d3.select(this).remove(); });
    });

    return () => {
      if (svgRef.current) {
        d3.select(svgRef.current).select('.anim-layer').selectAll('*').remove();
      }
    };
  }, [packetFlows, animationSpeed]);

  return (
    <div ref={containerRef} className="topology-container">
      <div className="topology-header">
        <span className="topology-header-label">
          TOPOLOGY
          <span className="topology-header-sub"> · drag nodes · pinch to zoom</span>
        </span>
        {selectedDevice && (
          <span className="topology-selected-badge">▶ {selectedDevice}</span>
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
