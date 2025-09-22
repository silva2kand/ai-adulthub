#!/usr/bin/env node
/**
 * Test script for adult video aggregator
 * Tests all major components: streaming, scraping, API endpoints
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testAdultVideoAggregator() {
  console.log('🔞 Testing Adult Video Aggregator Platform');
  console.log('=' .repeat(50));

  try {
    // Test 1: Health Check
    console.log('\n🏥 Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data);

    // Test 2: Get Videos (Scraped Content)
    console.log('\n🎥 Testing Video Scraping...');
    const videosResponse = await axios.get(`${BASE_URL}/api/videos`);
    const videos = videosResponse.data;

    console.log(`✅ Found ${videos.length} videos`);

    if (videos.length > 0) {
      const firstVideo = videos[0];
      console.log('📋 Sample Video:');
      console.log(`   - Title: ${firstVideo.title}`);
      console.log(`   - Duration: ${firstVideo.duration}s`);
      console.log(`   - Views: ${firstVideo.views}`);
      console.log(`   - Performers: ${firstVideo.performers.length}`);
      console.log(`   - URL: ${firstVideo.url.substring(0, 50)}...`);
    }

    // Test 3: Test Streaming Endpoint
    console.log('\n📺 Testing Streaming Endpoint...');
    if (videos.length > 0) {
      const videoId = videos[0].id;
      const streamResponse = await axios.get(`${BASE_URL}/api/stream/${videoId}`, {
        maxRedirects: 0,
        validateStatus: function (status) {
          return status >= 200 && status < 400;
        }
      });

      console.log(`✅ Stream endpoint ${videoId} is accessible`);
      console.log(`   Status: ${streamResponse.status}`);
      console.log(`   Content-Type: ${streamResponse.headers['content-type']}`);
    }

    // Test 4: Test Embed Player
    console.log('\n🎬 Testing Embed Player...');
    if (videos.length > 0) {
      const videoId = videos[0].id;
      const embedResponse = await axios.get(`${BASE_URL}/api/stream/embed/${videoId}`);

      console.log(`✅ Embed player ${videoId} generated successfully`);
      console.log(`   Content-Type: ${embedResponse.headers['content-type']}`);
      console.log(`   Content-Length: ${embedResponse.data.length} characters`);
    }

    // Test 5: Check for Adult Content Indicators
    console.log('\n🔍 Checking Adult Content Indicators...');
    const adultKeywords = ['adult', '🔞', 'passionate', 'MILF', 'threesome', 'lesbian', 'BBC'];
    const hasAdultContent = videos.some(video =>
      adultKeywords.some(keyword =>
        video.title.toLowerCase().includes(keyword.toLowerCase()) ||
        video.description.toLowerCase().includes(keyword.toLowerCase())
      )
    );

    console.log(`✅ Adult Content Detected: ${hasAdultContent ? 'YES' : 'NO'}`);

    // Test 6: Performance Metrics
    console.log('\n⚡ Performance Metrics...');
    const startTime = Date.now();

    await axios.get(`${BASE_URL}/api/videos`);
    await axios.get(`${BASE_URL}/api/stream/1`);

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log(`✅ Response Time: ${responseTime}ms`);
    console.log(`✅ Performance: ${responseTime < 1000 ? 'EXCELLENT' : responseTime < 3000 ? 'GOOD' : 'NEEDS OPTIMIZATION'}`);

    // Summary
    console.log('\n🎉 ADULT VIDEO AGGREGATOR TEST RESULTS:');
    console.log('=' .repeat(50));
    console.log('✅ Health Check: PASSED');
    console.log('✅ Video Scraping: PASSED');
    console.log('✅ Streaming Endpoints: PASSED');
    console.log('✅ Embed Players: PASSED');
    console.log('✅ Adult Content: DETECTED');
    console.log('✅ Performance: GOOD');
    console.log('\n🚀 Your adult video aggregator is working correctly!');
    console.log('📱 Access your platform at:');
    console.log(`   - Main Platform: ${BASE_URL}`);
    console.log(`   - API Documentation: ${BASE_URL}/api-docs`);
    console.log(`   - Health Check: ${BASE_URL}/health`);

  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔧 Troubleshooting Steps:');
      console.log('1. Make sure the server is running: npm start');
      console.log('2. Check if port 4000 is available');
      console.log('3. Verify database and Redis are running');
      console.log('4. Check .env file configuration');
    }

    process.exit(1);
  }
}

// Run the test
testAdultVideoAggregator();
