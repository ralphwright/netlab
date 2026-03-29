/**
 * cliComplete.js — IOS-style Tab completion for the NetLab CLI simulator.
 *
 * Mirrors the Python _HELP_TREES command tree from cli.py so completions
 * happen client-side with zero network latency.
 *
 * complete(input, mode) → { completed: string, ambiguous: string[] | null }
 *   - completed:  the expanded input to put in the text field
 *   - ambiguous:  array of matches when >1 prefix match found (show to user)
 *   - If nothing matches, returns the original input unchanged.
 *
 * IOS Tab completion rules:
 *   1. Unambiguous prefix → expand to full keyword + trailing space
 *   2. Ambiguous prefix   → do nothing, beep (caller shows options)
 *   3. Full word already  → expand next sub-keyword if only one option
 *   4. Empty input        → do nothing
 */

const CMD_TREES = {"user":{"enable":"Turn on privileged commands","exit":"Exit to lower level","ping":"Send echo messages","show":{"access-lists":"List access lists","arp":"ARP table","cdp":{"_desc":"CDP information","neighbors":"CDP neighbor entries"},"clock":"Display the system clock","crypto":{"_desc":"Encryption module","isakmp":{"_desc":"ISAKMP information","sa":"IKE Security Associations"},"ipsec":{"_desc":"IPsec information","sa":"IPsec Security Associations"},"key":{"_desc":"Long term key operations","mypubkey":{"_desc":"Public keys","rsa":"RSA public keys"}}},"dot11":{"_desc":"IEEE 802.11 commands","associations":"Wireless client associations"},"etherchannel":{"_desc":"EtherChannel information","summary":"One line summary per channel-group"},"flash:":"display information about flash: file system","hosts":"Host name-to-address mapping table","interfaces":{"_desc":"Interface status and configuration","brief":"Brief summary of all interfaces","GigabitEthernet0/0":"GigabitEthernet0/0 status","GigabitEthernet0/1":"GigabitEthernet0/1 status","Serial0/0/0":"Serial0/0/0 status","Tunnel0":"Tunnel0 status","vlan":"Vlan interface information"},"ip":{"_desc":"IP information","access-lists":"IP access lists","bgp":{"_desc":"BGP information","summary":"Summary of BGP neighbor status","neighbors":"Detailed BGP neighbor information"},"dhcp":{"_desc":"Show items in the DHCP database","binding":"DHCP address bindings","pool":"DHCP pool statistics","excluded-addresses":"Excluded addresses"},"interface":{"_desc":"IP interface status and configuration","brief":"Brief summary of IP status and configuration"},"nat":{"_desc":"IP NAT information","translations":"Translation entries","statistics":"Translation statistics"},"ospf":{"_desc":"OSPF information","neighbor":"Neighbor list","database":"OSPF link state database","interface":"OSPF interface information"},"route":{"_desc":"IP routing table","summary":"Summary of all routes"},"ssh":"Information on SSH"},"ipv6":{"_desc":"IPv6 information","interface":{"_desc":"IPv6 interface information","brief":"Brief summary"},"neighbors":"IPv6 neighbor table","route":"IPv6 routing table"},"logging":"Show the contents of logging buffers","mpls":{"_desc":"MPLS information","forwarding-table":"Show MPLS forwarding table","ldp":{"_desc":"MPLS LDP information","neighbor":"LDP neighbor information"}},"ntp":{"_desc":"Network time protocol","status":"NTP status","associations":"NTP associations"},"processes":"Active process statistics","protocols":"Active network routing protocols","running-config":"Current operating configuration","spanning-tree":"Spanning tree topology","startup-config":"Startup configuration","users":"Display information about terminal lines","version":"System hardware and software status","vlan":{"_desc":"VTP VLAN information","brief":"VTP all VLAN status in brief"},"vlans":"Virtual LAN information","wlan":{"_desc":"WLAN information","summary":"WLAN summary"},"zone":{"_desc":"Zone information","security":"Zone security information"},"zone-pair":{"_desc":"Zone pair information","security":"Zone pair security information"}},"?":"Help"},"privileged":{"clear":{"_desc":"Reset functions","ip":{"_desc":"IP functions","nat":{"_desc":"NAT functions","translations":"Clear NAT translation table"},"ospf":{"_desc":"OSPF functions","process":"Reset OSPF process"},"bgp":{"_desc":"BGP functions","*":"Clear BGP peer connection"}},"arp-cache":"Delete all ARP table entries","counters":"Clear interface counters"},"clock":{"_desc":"Manage the system clock","set":"Set the time and date"},"configure":{"_desc":"Enter configuration mode","terminal":"Configure from the terminal"},"copy":{"_desc":"Copy from one file to another","running-config":{"_desc":"Copy from current system configuration","startup-config":"Save running config to NVRAM","tftp:":"Copy to TFTP server"},"startup-config":{"_desc":"Copy from startup configuration","running-config":"Load startup config into running"},"tftp:":{"_desc":"Copy from TFTP","running-config":"Copy from TFTP to running config"}},"debug":{"_desc":"Debugging functions (may impact performance)","ip":{"_desc":"IP debugging","ospf":"OSPF debugging","bgp":"BGP debugging","nat":"NAT debugging"},"all":"Enable all debugging (caution)"},"disable":"Turn off privileged commands","exit":"Exit to user EXEC mode","no":{"_desc":"Negate a command","debug":"Disable debugging"},"ping":"Send echo messages","reload":"Halt and perform a cold restart","show":{"_desc":"Show running system information","access-lists":"List access lists","arp":"ARP table","cdp":{"_desc":"CDP information","neighbors":"CDP neighbor entries"},"clock":"Display the system clock","crypto":{"_desc":"Encryption module","isakmp":{"_desc":"ISAKMP information","sa":"IKE Security Associations"},"ipsec":{"_desc":"IPsec information","sa":"IPsec Security Associations"},"key":{"_desc":"Long term key operations","mypubkey":{"_desc":"Public keys","rsa":"RSA public keys"}}},"dot11":{"_desc":"IEEE 802.11 commands","associations":"Wireless client associations"},"etherchannel":{"_desc":"EtherChannel information","summary":"One line summary per channel-group"},"flash:":"display information about flash: file system","hosts":"Host name-to-address mapping table","interfaces":{"_desc":"Interface status and configuration","brief":"Brief summary of all interfaces","GigabitEthernet0/0":"GigabitEthernet0/0 status","GigabitEthernet0/1":"GigabitEthernet0/1 status","Serial0/0/0":"Serial0/0/0 status","Tunnel0":"Tunnel0 status","vlan":"Vlan interface information"},"ip":{"_desc":"IP information","access-lists":"IP access lists","bgp":{"_desc":"BGP information","summary":"Summary of BGP neighbor status","neighbors":"Detailed BGP neighbor information"},"dhcp":{"_desc":"Show items in the DHCP database","binding":"DHCP address bindings","pool":"DHCP pool statistics","excluded-addresses":"Excluded addresses"},"interface":{"_desc":"IP interface status and configuration","brief":"Brief summary of IP status and configuration"},"nat":{"_desc":"IP NAT information","translations":"Translation entries","statistics":"Translation statistics"},"ospf":{"_desc":"OSPF information","neighbor":"Neighbor list","database":"OSPF link state database","interface":"OSPF interface information"},"route":{"_desc":"IP routing table","summary":"Summary of all routes"},"ssh":"Information on SSH"},"ipv6":{"_desc":"IPv6 information","interface":{"_desc":"IPv6 interface information","brief":"Brief summary"},"neighbors":"IPv6 neighbor table","route":"IPv6 routing table"},"logging":"Show the contents of logging buffers","mpls":{"_desc":"MPLS information","forwarding-table":"Show MPLS forwarding table","ldp":{"_desc":"MPLS LDP information","neighbor":"LDP neighbor information"}},"ntp":{"_desc":"Network time protocol","status":"NTP status","associations":"NTP associations"},"processes":"Active process statistics","protocols":"Active network routing protocols","running-config":"Current operating configuration","spanning-tree":"Spanning tree topology","startup-config":"Startup configuration","users":"Display information about terminal lines","version":"System hardware and software status","vlan":{"_desc":"VTP VLAN information","brief":"VTP all VLAN status in brief"},"vlans":"Virtual LAN information","wlan":{"_desc":"WLAN information","summary":"WLAN summary"},"zone":{"_desc":"Zone information","security":"Zone security information"},"zone-pair":{"_desc":"Zone pair information","security":"Zone pair security information"}},"ssh":"Open a secure shell client connection","telnet":"Open a telnet connection","terminal":{"_desc":"Set terminal line parameters","length":"Set number of lines on a screen","width":"Set width of the terminal screen"},"traceroute":"Trace route to destination","undebug":{"_desc":"Disable debugging functions","all":"Disable all debugging"},"write":{"_desc":"Write running configuration to memory, network, or terminal","memory":"Write to NV memory","terminal":"Write to terminal","erase":"Erase NV memory"}},"config":{"access-list":"Add an access list entry","banner":{"_desc":"Define a login banner","motd":"Set Message of the Day banner"},"boot":{"_desc":"Boot commands","system":"Boot system file"},"clock":{"_desc":"Configure time-of-day clock","timezone":"Configure time zone"},"crypto":{"_desc":"Encryption module","isakmp":{"_desc":"ISAKMP configuration","policy":"ISAKMP policy configuration"},"ipsec":{"_desc":"IPsec configuration","transform-set":"IPsec transform set"},"key":{"_desc":"Long term key operations","generate":{"_desc":"Generate a key","rsa":"Generate RSA key pair"}},"dynamic-map":"Specify a dynamic crypto map template","map":"Enter a crypto map"},"do":"To run exec commands in config mode","dot11":{"_desc":"IEEE 802.11 commands","ssid":"Configure an SSID"},"enable":{"_desc":"Modify enable password parameters","secret":"Assign the privileged level secret"},"end":"Exit from configure mode","exit":"Exit from configure mode","hostname":"Set system's network name","interface":{"_desc":"Select an interface to configure","GigabitEthernet":"GigabitEthernet IEEE 802.3","FastEthernet":"FastEthernet IEEE 802.3","Serial":"Serial","Loopback":"Loopback interface","Port-channel":"Ethernet Channel of interfaces","Tunnel":"Tunnel interface","Vlan":"Catalyst VLANs"},"ip":{"_desc":"Global IP configuration commands","access-list":{"_desc":"Named access list","extended":"Extended access list","standard":"Standard access list"},"dhcp":{"_desc":"Configure DHCP server","excluded-address":"Prevent server from assigning these addresses","pool":"Configure DHCP address pool"},"domain-name":"Define the default domain name","host":"Add an entry to the IP hostname table","name-server":"Specify address of name server to use","nat":{"_desc":"NAT configuration commands","inside":{"_desc":"Inside address translation","source":"Source address translation"}},"route":"Establish static routes","routing":"Enable IP routing","ssh":{"_desc":"Configure SSH","version":"Specify protocol version to be supported"}},"ipv6":{"_desc":"Global IPv6 configuration commands","unicast-routing":"Enable IPv6 unicast routing"},"line":{"_desc":"Configure a terminal line","console":"Primary terminal line","vty":"Virtual terminal"},"logging":"Modify message logging facilities","mpls":{"_desc":"MPLS configuration","ip":"Enable MPLS forwarding"},"no":"Negate a command or set its defaults","ntp":{"_desc":"Configure NTP","server":"Configure an NTP server"},"radius":{"_desc":"RADIUS server configuration","server":"Configure a RADIUS server"},"router":{"_desc":"Enable a routing process","bgp":"Border Gateway Protocol (BGP)","eigrp":"Enhanced Interior Gateway Routing Protocol (EIGRP)","ospf":"Open Shortest Path First (OSPF)","rip":"Routing Information Protocol (RIP)"},"service":{"_desc":"Modify use of network based services","password-encryption":"Encrypt system passwords","timestamps":"Timestamp debug/log messages"},"snmp-server":"Modify SNMP parameters","spanning-tree":{"_desc":"Spanning Tree Subsystem","mode":{"_desc":"Spanning tree operating mode","pvst":"Per-VLAN spanning tree mode","rapid-pvst":"Per-VLAN rapid spanning tree"},"portfast":{"_desc":"Spanning tree portfast options","default":"Enable portfast by default on all access ports"},"vlan":"VLAN Switch Spanning Tree"},"username":"Establish User Name Authentication","vlan":"VLAN commands","wlan":"Wireless LAN configuration","zone":{"_desc":"Zone configuration","security":"Security zone"},"zone-pair":{"_desc":"Zone pair configuration","security":"Security zone pair"}},"config-if":{"channel-group":"Etherchannel/port bundling function","description":"Interface specific description","do":"To run exec commands in config mode","duplex":{"_desc":"Configure duplex operation","auto":"Auto duplex","full":"Force full duplex","half":"Force half-duplex"},"encapsulation":{"_desc":"Set encapsulation type for an interface","dot1q":"IEEE 802.1Q Virtual LAN"},"end":"Exit from configure mode","exit":"Exit from current mode","ip":{"_desc":"Interface Internet Protocol config commands","access-group":"Specify access control for packets","address":"Set the IP address of an interface","helper-address":"Specify a destination address for UDP broadcasts","nat":{"_desc":"NAT interface commands","inside":"NAT inside interface","outside":"NAT outside interface"},"ospf":{"_desc":"OSPF interface commands","cost":"Interface cost","priority":"Router priority","area":"Enable OSPF on this interface"}},"ipv6":{"_desc":"IPv6 interface subcommands","address":"Configure IPv6 address on interface","ospf":"IPv6 OSPF interface parameters"},"mpls":{"_desc":"MPLS interface commands","ip":"Enable MPLS on this interface"},"no":"Negate a command or set its defaults","shutdown":"Shutdown the selected interface","no shutdown":"Enable the selected interface","spanning-tree":{"_desc":"Spanning Tree Subsystem","bpduguard":{"_desc":"Don't accept BPDUs on this interface","enable":"Enable BPDU guard for this interface"},"portfast":"Portfast options for the interface"},"speed":{"_desc":"Configure speed operation","auto":"Enable AUTO speed configuration","10":"Force 10 Mbps operation","100":"Force 100 Mbps operation","1000":"Force 1000 Mbps operation"},"switchport":{"_desc":"Set switching mode characteristics","access":{"_desc":"Set access mode characteristics of the interface","vlan":"Set VLAN when interface is in access mode"},"mode":{"_desc":"Set trunking mode of the interface","access":"Set trunking mode to ACCESS unconditionally","trunk":"Set trunking mode to TRUNK unconditionally","dynamic":{"_desc":"Set trunking mode to dynamically negotiate","auto":"Set mode to dynamically negotiate","desirable":"Set mode to dynamically negotiate"}},"nonegotiate":"Device will not engage in negotiation protocol on this interface","trunk":{"_desc":"Set trunking characteristics of the interface","allowed":{"_desc":"Set allowed VLAN characteristics","vlan":"Set allowed VLANs on the trunk link"},"encapsulation":"Set encapsulation type for trunk","native":{"_desc":"Set trunking native characteristics","vlan":"Set native VLAN when interface is in trunking mode"}}},"tunnel":{"_desc":"Protocol-over-Protocol tunneling","destination":"Set the destination of the tunnel","mode":{"_desc":"Tunnel encapsulation method","gre":{"_desc":"Generic Route Encapsulation Protocol","ip":"GRE over IP"}},"source":"Set the source of the tunnel"},"zone-member":{"_desc":"Zone membership for the interface","security":"Zone security membership"}},"config-router":{"area":{"_desc":"OSPF area parameters","authentication":"Enable authentication","stub":"Settings for configuring the area as a stub"},"auto-summary":"Enable automatic network number summarization","default-information":{"_desc":"Control distribution of default information","originate":"Distribute a default route"},"do":"To run exec commands in config mode","end":"Exit from configure mode","exit":"Exit from routing protocol configuration mode","neighbor":"Specify a neighbor router","network":"Enable routing on an IP network","no":"Negate a command or set its defaults","passive-interface":"Suppress routing updates on an interface","redistribute":"Redistribute information from another routing protocol","remote-as":"Specify the remote AS number","router-id":"Router-id for this OSPF process","timers":"Adjust routing timers","update-source":"Source of routing updates"},"config-vlan":{"do":"To run exec commands in config mode","end":"Exit from configure mode","exit":"Exit from current mode","name":"Ascii name of the VLAN","no":"Negate a command or set its defaults","state":{"_desc":"Operational state of the VLAN","active":"VLAN active state","suspend":"VLAN suspend state"}},"config-line":{"access-class":"Filter connections based on an IP access list","do":"To run exec commands in config mode","end":"Exit from configure mode","exec-timeout":"Set the EXEC timeout","exit":"Exit from current mode","login":{"_desc":"Enable password checking","local":"Local password checking"},"logging":{"_desc":"Modify message logging facilities","synchronous":"Synchronize unsolicited messages"},"no":"Negate a command or set its defaults","password":"Set a password","transport":{"_desc":"Define transport protocols for line","input":{"_desc":"Define which protocols to use when connecting to the terminal server","ssh":"TCP/IP SSH protocol","telnet":"TCP/IP Telnet protocol","all":"All protocols","none":"No protocols"}}},"config-dhcp":{"default-router":"Default routers","dns-server":"DNS servers","do":"To run exec commands in config mode","domain-name":"Domain name","end":"Exit from configure mode","exit":"Exit from current mode","lease":{"_desc":"Address lease time","infinite":"Infinite lease time"},"network":"Network number and mask","no":"Negate a command or set its defaults"},"config-acl":{"deny":"Specify packets to reject","do":"To run exec commands in config mode","end":"Exit from configure mode","exit":"Exit from current mode","no":"Negate a command or set its defaults","permit":"Specify packets to forward","remark":"Access list entry comment"},"config-zone":{"do":"To run exec commands in config mode","end":"Exit from configure mode","exit":"Exit from current mode","no":"Negate a command","service-policy":{"_desc":"Configure zone-pair service policy","type":{"_desc":"Policy type","inspect":"Inspect policy"}}},"config-tunnel":{"channel-group":"Etherchannel/port bundling function","description":"Interface specific description","do":"To run exec commands in config mode","duplex":{"_desc":"Configure duplex operation","auto":"Auto duplex","full":"Force full duplex","half":"Force half-duplex"},"encapsulation":{"_desc":"Set encapsulation type for an interface","dot1q":"IEEE 802.1Q Virtual LAN"},"end":"Exit from configure mode","exit":"Exit from current mode","ip":{"_desc":"Interface Internet Protocol config commands","access-group":"Specify access control for packets","address":"Set the IP address of an interface","helper-address":"Specify a destination address for UDP broadcasts","nat":{"_desc":"NAT interface commands","inside":"NAT inside interface","outside":"NAT outside interface"},"ospf":{"_desc":"OSPF interface commands","cost":"Interface cost","priority":"Router priority","area":"Enable OSPF on this interface"}},"ipv6":{"_desc":"IPv6 interface subcommands","address":"Configure IPv6 address on interface","ospf":"IPv6 OSPF interface parameters"},"mpls":{"_desc":"MPLS interface commands","ip":"Enable MPLS on this interface"},"no":"Negate a command or set its defaults","shutdown":"Shutdown the selected interface","no shutdown":"Enable the selected interface","spanning-tree":{"_desc":"Spanning Tree Subsystem","bpduguard":{"_desc":"Don't accept BPDUs on this interface","enable":"Enable BPDU guard for this interface"},"portfast":"Portfast options for the interface"},"speed":{"_desc":"Configure speed operation","auto":"Enable AUTO speed configuration","10":"Force 10 Mbps operation","100":"Force 100 Mbps operation","1000":"Force 1000 Mbps operation"},"switchport":{"_desc":"Set switching mode characteristics","access":{"_desc":"Set access mode characteristics of the interface","vlan":"Set VLAN when interface is in access mode"},"mode":{"_desc":"Set trunking mode of the interface","access":"Set trunking mode to ACCESS unconditionally","trunk":"Set trunking mode to TRUNK unconditionally","dynamic":{"_desc":"Set trunking mode to dynamically negotiate","auto":"Set mode to dynamically negotiate","desirable":"Set mode to dynamically negotiate"}},"nonegotiate":"Device will not engage in negotiation protocol on this interface","trunk":{"_desc":"Set trunking characteristics of the interface","allowed":{"_desc":"Set allowed VLAN characteristics","vlan":"Set allowed VLANs on the trunk link"},"encapsulation":"Set encapsulation type for trunk","native":{"_desc":"Set trunking native characteristics","vlan":"Set native VLAN when interface is in trunking mode"}}},"tunnel":{"_desc":"Protocol-over-Protocol tunneling","destination":"Set the destination of the tunnel","mode":{"_desc":"Tunnel encapsulation method","gre":{"_desc":"Generic Route Encapsulation Protocol","ip":"GRE over IP"}},"source":"Set the source of the tunnel"},"zone-member":{"_desc":"Zone membership for the interface","security":"Zone security membership"}}};


/**
 * Walk the tree following the given token list.
 * Returns the node at that depth, or null if the path doesn't exist.
 */
function walkTree(tokens, tree) {
  let node = tree;
  for (const tok of tokens) {
    if (!node || typeof node !== 'object') return null;
    const tl = tok.toLowerCase();
    if (tl in node) {
      node = node[tl];
    } else {
      // Try prefix match — only if exactly one match
      const matches = Object.keys(node).filter(
        k => k !== '_desc' && k.startsWith(tl)
      );
      if (matches.length === 1) {
        node = node[matches[0]];
      } else {
        return null;
      }
    }
  }
  return node;
}

/**
 * Get the child keywords of a node (excluding _desc).
 */
function childKeys(node) {
  if (!node || typeof node !== 'object') return [];
  return Object.keys(node).filter(k => k !== '_desc');
}

/**
 * Main completion function.
 *
 * @param {string} input   - Current text field value (e.g. "sh ip ro")
 * @param {string} mode    - Current IOS mode (e.g. "privileged", "config-if")
 * @returns {{ completed: string, ambiguous: string[]|null, ringBell: boolean }}
 */
export function complete(input, mode) {
  const tree = CMD_TREES[mode] || CMD_TREES['privileged'] || {};
  const trimmed = input.trimEnd();

  if (!trimmed) return { completed: input, ambiguous: null, ringBell: false };

  const hasTrailingSpace = input !== trimmed || input.endsWith(' ');
  const tokens = trimmed.split(/\s+/);

  if (hasTrailingSpace) {
    // Trailing space — show/complete next level
    const parent = walkTree(tokens, tree);
    if (!parent || typeof parent !== 'object') {
      // We're at a leaf — nothing to complete
      return { completed: input, ambiguous: null, ringBell: true };
    }
    const kids = childKeys(parent);
    if (kids.length === 0) {
      return { completed: input, ambiguous: null, ringBell: true };
    }
    if (kids.length === 1) {
      // Only one option — auto-complete it
      return { completed: trimmed + ' ' + kids[0] + ' ', ambiguous: null, ringBell: false };
    }
    // Multiple options — return them for display
    return { completed: input, ambiguous: kids, ringBell: false };
  }

  // No trailing space — try to complete the last token
  const lastTok  = tokens[tokens.length - 1].toLowerCase();
  const prevToks = tokens.slice(0, -1);

  // Walk to the parent of the last token
  const parent = prevToks.length > 0 ? walkTree(prevToks, tree) : tree;
  if (!parent || typeof parent !== 'object') {
    return { completed: input, ambiguous: null, ringBell: true };
  }

  // Find prefix matches for lastTok
  const matches = childKeys(parent).filter(k => k.startsWith(lastTok));

  if (matches.length === 0) {
    return { completed: input, ambiguous: null, ringBell: true };
  }

  if (matches.length === 1) {
    // Unambiguous — complete to full keyword
    const full = (prevToks.length > 0 ? prevToks.join(' ') + ' ' : '') + matches[0];
    const child = parent[matches[0]];
    // If the child is a leaf string (no sub-keywords), add trailing space
    const trailingSpace = (typeof child === 'string') ? ' ' : ' ';
    return { completed: full + trailingSpace, ambiguous: null, ringBell: false };
  }

  // Ambiguous — find longest common prefix among matches
  let lcp = matches[0];
  for (const m of matches.slice(1)) {
    let i = 0;
    while (i < lcp.length && i < m.length && lcp[i] === m[i]) i++;
    lcp = lcp.slice(0, i);
  }
  // If LCP is longer than what user typed, expand to LCP
  if (lcp.length > lastTok.length) {
    const expanded = (prevToks.length > 0 ? prevToks.join(' ') + ' ' : '') + lcp;
    return { completed: expanded, ambiguous: matches, ringBell: false };
  }

  // Can't expand further — return ambiguous list
  return { completed: input, ambiguous: matches, ringBell: false };
}

/**
 * Format an ambiguous completion list like real IOS:
 *   show ip ?
 *   access-lists  bgp  dhcp  interface  nat  ospf  route  ssh
 */
export function formatAmbiguous(matches) {
  return '  ' + matches.join('    ');
}
