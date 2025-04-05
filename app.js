const express = require('express');
const os = require('os');
const app = express();
const port = process.env.PORT || 3000;

// Set view engine to EJS
app.set('view engine', 'ejs');

// Serve static files from the public directory
app.use(express.static('public'));

// Helper functions
function bytesToGB(bytes) {
  return (bytes / 1024 / 1024 / 1024).toFixed(2);
}

function bytesToMB(bytes) {
  return (bytes / 1024 / 1024).toFixed(2);
}

function formatUptime(uptime) {
  return (uptime / 60 / 60).toFixed(2);
}

// Function to calculate CPU usage
function getCpuUsage(callback) {
  const startMeasure = os.cpus().map(cpu => {
    return {
      idle: cpu.times.idle,
      total: Object.values(cpu.times).reduce((acc, tv) => acc + tv, 0)
    };
  });
  
  // Wait for 100ms to get second measurement
  setTimeout(() => {
    const endMeasure = os.cpus().map(cpu => {
      return {
        idle: cpu.times.idle,
        total: Object.values(cpu.times).reduce((acc, tv) => acc + tv, 0)
      };
    });
    
    const idleDifferences = [];
    const totalDifferences = [];
    
    for (let i = 0; i < startMeasure.length; i++) {
      const idleDifference = endMeasure[i].idle - startMeasure[i].idle;
      const totalDifference = endMeasure[i].total - startMeasure[i].total;
      
      idleDifferences.push(idleDifference);
      totalDifferences.push(totalDifference);
    }
    
    const idleAverage = idleDifferences.reduce((acc, val) => acc + val, 0) / idleDifferences.length;
    const totalAverage = totalDifferences.reduce((acc, val) => acc + val, 0) / totalDifferences.length;
    
    const cpuUsage = 100 - ((idleAverage / totalAverage) * 100);
    callback(cpuUsage.toFixed(1));
  }, 100);
}

// Route for the home page
app.get('/', (req, res) => {
  const serverInfo = {
    hostname: os.hostname(),
    localTime: new Date().toLocaleString(),
    platform: os.platform(),
    arch: os.arch(),
    uptime: formatUptime(os.uptime()),
    memory: bytesToGB(os.totalmem())
  };
  
  res.render('index', { serverInfo });
});

// Route for metrics data
app.get('/metrics', (req, res) => {
  getCpuUsage((cpuUsage) => {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memoryUsage = ((usedMem / totalMem) * 100).toFixed(1);
    
    const metrics = {
      cpuUsage: cpuUsage,
      memoryUsage: memoryUsage,
      freeMemory: bytesToGB(freeMem),
      processMemory: bytesToMB(process.memoryUsage().rss)
    };
    
    res.json(metrics);
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Hostname: ${os.hostname()}`);
  console.log(`Platform: ${os.platform()}`);
});