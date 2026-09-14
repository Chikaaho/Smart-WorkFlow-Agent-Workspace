const net = require('net');
const s = net.createConnection(5432, '127.0.0.1');
function msg(d) { const b = Buffer.alloc(d.length + 4); b.writeInt32BE(d.length + 4, 0); d.copy(b, 4); return b; }
s.on('connect', () => {
  const payload = Buffer.concat([(() => { const b = Buffer.alloc(4); b.writeInt32BE(196608); return b; })(),
    Buffer.from('user\0postgres\0database\0smart_workflow_run\0\0')]);
  s.write(msg(payload));
});
s.on('data', d => { console.log(d[0], JSON.stringify(d.toString('latin1').slice(0, 150))); s.end(); });
s.on('error', e => console.log('ERR', e.message));
setTimeout(() => process.exit(0), 3000);
