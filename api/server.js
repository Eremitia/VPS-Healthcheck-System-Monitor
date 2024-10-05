const si = require('systeminformation');
const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors({
    origin: '*',
}));
app.get('/api/healthcheck', async (req, res) => {
    try {
        const cpu = await si.cpu();
        const cpuSpeed = await si.cpuCurrentSpeed();
        const cpuTemp = await si.cpuTemperature();
        const cpuLoad = await si.currentLoad();

        const memory = await si.mem();

        const disks = await si.fsSize();

        const osInfo = await si.osInfo();

        const networkInterfaces = await si.networkInterfaces();
        const networkStats = await si.networkStats();
        const uptime = si.time().uptime;

        res.json({
            cpu: {
                manufacturer: cpu.manufacturer,
                brand: cpu.brand,
                speed: cpuSpeed.avg + ' GHz',
                cores: cpu.cores,
                temperature: cpuTemp.main + ' °C',
                load: cpuLoad.currentLoad.toFixed(2) + '%',
            },
            memory: {
                total: formatBytes(memory.total),
                used: formatBytes(memory.used),
                free: formatBytes(memory.free),
                usage: ((memory.used / memory.total) * 100).toFixed(2) + '%',
            },
            disks: disks.map(disk => ({
                filesystem: disk.fs,
                size: formatBytes(disk.size),
                used: formatBytes(disk.used),
                available: formatBytes(disk.available),
                usage: ((disk.used / disk.size) * 100).toFixed(2) + '%',
                mount: disk.mount,
            })),
            os: {
                platform: osInfo.platform,
                distro: osInfo.distro,
                release: osInfo.release,
                arch: osInfo.arch,
                hostname: osInfo.hostname,
            },
            network: networkInterfaces.map((iface, index) => ({
                iface: iface.iface,
                mac: iface.mac,
                ip4: iface.ip4,
                speed: networkStats[index]?.tx_sec ? (networkStats[index].tx_sec / 1024).toFixed(2) + ' KB/s' : 'N/A',
            })),
            uptime: formatUptime(uptime),
        });
    } catch (error) {
        console.error('Error obteniendo la información del sistema:', error);
        res.status(500).send('Error obteniendo la información del sistema');
    }
});

function formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

function formatUptime(seconds) {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

app.listen(port, () => {
    console.log(`Servidor de healthcheck corriendo en http://localhost:${port}`);
});
