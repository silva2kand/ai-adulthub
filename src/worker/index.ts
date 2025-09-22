import { Worker } from 'bullmq';

const worker = new Worker('video-processing', async (job) => {
  console.log(`Processing job ${job.id} with data:`, job.data);
  // Example: mock processing
  if (job.data.type === 'update-views') {
    console.log(`Mock updating views for video ${job.data.videoId}`);
  }
}, {
  connection: {
    host: process.env.REDIS_HOST || 'redis',
    port: 6379,
  },
});

worker.on('completed', (job) => {
  if (job) {
    console.log(`Job ${job.id} completed`);
  }
});

worker.on('failed', (job, err) => {
  if (job) {
    console.log(`Job ${job.id} failed with error:`, err);
  }
});

console.log('Worker started');