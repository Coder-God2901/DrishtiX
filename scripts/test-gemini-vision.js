/**
 * Test Script for Gemini Vision Anomaly Detection
 *
 * Prerequisites:
 * 1. Set VITE_GEMINI_API_KEY in .env
 * 2. Set VITE_GEMINI_VISION_ENABLED=true in .env
 * 3. Place test images in test-images/ directory
 *
 * Run: node scripts/test-gemini-vision.js
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const API_KEY = process.env.VITE_GEMINI_API_KEY;
const VISION_ENABLED = process.env.VITE_GEMINI_VISION_ENABLED === 'true';

if (!API_KEY) {
  console.error('❌ VITE_GEMINI_API_KEY not set in .env file');
  console.error('   Get API key from: https://makersuite.google.com/app/apikey');
  process.exit(1);
}

if (!VISION_ENABLED) {
  console.warn('⚠️  VITE_GEMINI_VISION_ENABLED is false');
  console.warn('   Set to true in .env to enable vision analysis');
}

/**
 * Analyze image with Gemini Vision
 */
async function analyzeImage(imagePath, scenario) {
  console.log(`\n📷 Analyzing: ${scenario}`);
  console.log(`   Image: ${imagePath}`);

  // Read and encode image
  let imageBase64;
  try {
    if (fs.existsSync(imagePath)) {
      imageBase64 = fs.readFileSync(imagePath, 'base64');
    } else {
      console.warn(`   ⚠️  Image not found, using placeholder`);
      // Create a small placeholder image
      imageBase64 = createPlaceholderImage();
    }
  } catch (error) {
    console.error(`   ❌ Failed to read image:`, error.message);
    return null;
  }

  const prompt = `
Analyze this crowd safety camera feed for potential hazards:

1. **SMOKE DETECTION**: Is there any smoke, haze, or vapor visible? (not including fog machines or stage effects)
2. **FIRE DETECTION**: Is there any flame, fire, or glowing combustion visible?
3. **PANIC BEHAVIOR**: Are people running, pushing, showing signs of distress or panic?
4. **CROWD CRUSH**: Is there extreme crowd density where people appear compressed or unable to move?

Respond in JSON format:
{
  "hasSmoke": boolean,
  "hasFire": boolean,
  "hasPanic": boolean,
  "hasCrowdCrush": boolean,
  "confidence": number (0.0-1.0),
  "description": "brief description of what you see",
  "objects": ["list", "of", "detected", "objects"]
}

Be very precise - false alarms can cause unnecessary evacuations.
  `.trim();

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${API_KEY}`,
      {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: imageBase64,
                },
              },
            ],
          },
        ],
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 20000,
      }
    );

    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('   ❌ Could not parse Gemini response');
      console.log('   Raw response:', text.substring(0, 200));
      return null;
    }

    const result = JSON.parse(jsonMatch[0]);

    // Display results
    console.log('   ✅ Analysis complete');
    console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`   Description: ${result.description}`);

    // Check for anomalies
    const anomalies = [];
    if (result.hasSmoke) anomalies.push('🌫️  SMOKE');
    if (result.hasFire) anomalies.push('🔥 FIRE');
    if (result.hasPanic) anomalies.push('😱 PANIC');
    if (result.hasCrowdCrush) anomalies.push('⚠️  CRUSH');

    if (anomalies.length > 0) {
      console.log(`   ⚠️  ANOMALIES DETECTED: ${anomalies.join(', ')}`);
    } else {
      console.log('   ✅ No anomalies detected');
    }

    if (result.objects && result.objects.length > 0) {
      console.log(`   Objects: ${result.objects.join(', ')}`);
    }

    return result;
  } catch (error) {
    if (error.response?.status === 429) {
      console.error('   ❌ Rate limit exceeded - wait 60 seconds');
    } else if (error.response?.status === 400) {
      console.error('   ❌ Bad request:', error.response.data.error?.message);
    } else {
      console.error('   ❌ API error:', error.message);
    }
    return null;
  }
}

/**
 * Create a placeholder image (1x1 pixel)
 */
function createPlaceholderImage() {
  // Minimal JPEG base64 (1x1 black pixel)
  return '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA//2Q==';
}

/**
 * Test different scenarios
 */
async function runTests() {
  console.log('🚀 Gemini Vision Anomaly Detection Test');
  console.log('='.repeat(60));
  console.log('API Key:', API_KEY.substring(0, 20) + '...');
  console.log('Vision Enabled:', VISION_ENABLED);
  console.log('='.repeat(60));

  const testScenarios = [
    {
      name: 'Normal Crowd',
      image: './test-images/normal-crowd.jpg',
      expected: { smoke: false, fire: false, panic: false, crush: false },
    },
    {
      name: 'Smoke Scene',
      image: './test-images/smoke-scene.jpg',
      expected: { smoke: true, fire: false, panic: false, crush: false },
    },
    {
      name: 'Fire Hazard',
      image: './test-images/fire-hazard.jpg',
      expected: { smoke: true, fire: true, panic: false, crush: false },
    },
    {
      name: 'Panic Crowd',
      image: './test-images/panic-crowd.jpg',
      expected: { smoke: false, fire: false, panic: true, crush: false },
    },
    {
      name: 'Dense Crowd (Crush Risk)',
      image: './test-images/dense-crowd.jpg',
      expected: { smoke: false, fire: false, panic: false, crush: true },
    },
  ];

  const results = {
    total: testScenarios.length,
    successful: 0,
    failed: 0,
    correct: 0,
    incorrect: 0,
    totalCost: 0,
  };

  for (const scenario of testScenarios) {
    const result = await analyzeImage(scenario.image, scenario.name);

    if (result) {
      results.successful++;

      // Check accuracy
      const correct =
        result.hasSmoke === scenario.expected.smoke &&
        result.hasFire === scenario.expected.fire &&
        result.hasPanic === scenario.expected.panic &&
        result.hasCrowdCrush === scenario.expected.crush;

      if (correct) {
        results.correct++;
        console.log('   ✅ Prediction matches expected outcome');
      } else {
        results.incorrect++;
        console.log('   ⚠️  Prediction differs from expected');
        console.log('   Expected:', scenario.expected);
        console.log('   Got:', {
          smoke: result.hasSmoke,
          fire: result.hasFire,
          panic: result.hasPanic,
          crush: result.hasCrowdCrush,
        });
      }

      // Estimate cost ($0.0025 per image)
      results.totalCost += 0.0025;
    } else {
      results.failed++;
    }

    // Wait between requests to avoid rate limits
    if (testScenarios.indexOf(scenario) < testScenarios.length - 1) {
      console.log('   ⏳ Waiting 2 seconds...');
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results Summary');
  console.log('='.repeat(60));
  console.log(`Total Tests:       ${results.total}`);
  console.log(`Successful:        ${results.successful} / ${results.total}`);
  console.log(`Failed:            ${results.failed}`);
  console.log(`Correct Predictions: ${results.correct} / ${results.successful}`);
  console.log(`Accuracy:          ${((results.correct / results.successful) * 100).toFixed(1)}%`);
  console.log(`Estimated Cost:    $${results.totalCost.toFixed(4)}`);
  console.log('='.repeat(60));

  if (results.successful === results.total && results.correct === results.successful) {
    console.log('\n✅ All tests passed! Gemini Vision is working correctly.');
  } else if (results.failed > 0) {
    console.log('\n⚠️  Some tests failed. Check API configuration.');
  } else {
    console.log('\n⚠️  Tests completed but accuracy may need tuning.');
  }

  // Recommendations
  console.log('\n📋 Recommendations:');
  if (results.correct < results.successful) {
    console.log('   - Adjust confidence thresholds in anomaly-detection.service.ts');
    console.log('   - Review prompt engineering for better accuracy');
    console.log('   - Add more training examples to test set');
  }
  if (results.failed > 0) {
    console.log('   - Check internet connection');
    console.log('   - Verify API key is valid');
    console.log('   - Check rate limits (60 requests/minute on free tier)');
  }
  console.log('   - Create test-images/ directory with sample images');
  console.log('   - Test with real event footage for better validation');
}

/**
 * Create test images directory if it doesn't exist
 */
function setupTestImages() {
  const testDir = './test-images';
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
    console.log(`\n📁 Created ${testDir} directory`);
    console.log('   Please add test images:');
    console.log('   - normal-crowd.jpg');
    console.log('   - smoke-scene.jpg');
    console.log('   - fire-hazard.jpg');
    console.log('   - panic-crowd.jpg');
    console.log('   - dense-crowd.jpg');
    console.log('\n   Using placeholder images for now...\n');
  }
}

/**
 * Main execution
 */
async function main() {
  setupTestImages();
  await runTests();
}

// Run tests
main().catch((error) => {
  console.error('\n❌ Test execution failed:', error.message);
  process.exit(1);
});
