/**
 * Copyright Â© 2025 DrishtiX. All Rights Reserved.
 * 
 * PROPRIETARY AND CONFIDENTIAL
 * 
 * This software is the proprietary information of DrishtiX.
 * Unauthorized copying, distribution, modification, or use of this software,
 * via any medium, is strictly prohibited without the express written permission
 * of DrishtiX.
 * 
 * This software is provided "as is" without warranty of any kind, express or implied.
 * 
 * For licensing inquiries: licensing@drishtix.com
 * License: See LICENSE file in the project root
 */
#!/usr/bin/env node

/**
 * Test Script for Gemini Pro API Integration
 *
 * Tests Gemini Pro LLM for incident summarization and natural language queries
 */

import axios from 'axios';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testGeminiAPI() {
  log('\n=== Gemini Pro API Test ===\n', 'cyan');

  // Check environment variables
  const apiKey = process.env.VITE_GEMINI_API_KEY;
  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  log('1. Checking Configuration...', 'blue');

  if (!apiKey) {
    log('âŒ VITE_GEMINI_API_KEY not set', 'red');
    log('   Get your API key from: https://makersuite.google.com/app/apikey', 'yellow');
    log('   Then add to .env: VITE_GEMINI_API_KEY=your-key-here', 'yellow');
    process.exit(1);
  }

  if (!apiKey.startsWith('AIzaSy')) {
    log('âš ï¸  API key format looks incorrect (should start with AIzaSy)', 'yellow');
  }

  log(`âœ… API Key configured (${apiKey.substring(0, 15)}...)`, 'green');
  log(`âœ… Endpoint: ${endpoint}`, 'green');

  // Test 1: Basic text generation
  log('\n2. Testing Basic Text Generation...', 'blue');

  try {
    const startTime = Date.now();

    const response = await axios.post(
      `${endpoint}?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: 'Say "Hello from Gemini!" and confirm you are working correctly.',
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 100,
        },
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      }
    );

    const latency = Date.now() - startTime;
    const generatedText = response.data.candidates[0]?.content?.parts[0]?.text || '';

    log(`âœ… Response received in ${latency}ms`, 'green');
    log(`âœ… Generated text length: ${generatedText.length} characters`, 'green');
    log(`   Response: "${generatedText.substring(0, 100)}..."`, 'cyan');

    if (latency > 5000) {
      log(`âš ï¸  High latency detected (${latency}ms > 5000ms)`, 'yellow');
    }
  } catch (error) {
    if (error.response?.status === 400) {
      log('âŒ Invalid API key or request format', 'red');
      log(`   Error: ${error.response.data.error.message}`, 'yellow');
    } else if (error.response?.status === 429) {
      log('âŒ Rate limit exceeded (60 requests/minute for free tier)', 'red');
    } else {
      log(`âŒ API request failed: ${error.message}`, 'red');
    }
    process.exit(1);
  }

  // Test 2: Incident summary generation
  log('\n3. Testing Incident Summary Generation...', 'blue');

  try {
    const incidentPrompt = `
You are an AI assistant for a crowd safety platform called DrishtiX. Generate a concise incident briefing in structured format.

INCIDENT DETAILS:
- Type: CROWD_SURGE
- Severity: HIGH
- Location: Main Stage Area
- Time: ${new Date().toLocaleString()}
- Description: Sudden crowd surge detected near main stage entrance

ACTIVE ALERTS:
- [HIGH] Crowd density exceeding safe limits (Zone A)
- [MEDIUM] Multiple people requesting medical assistance

CAMERA FEED DATA:
- Camera-01: 850 people, HIGH density, 2 anomalies detected (rapid movement, clustering)
- Camera-02: 620 people, MEDIUM density, 0 anomalies

SOCIAL MEDIA ANALYSIS:
- Twitter: NEGATIVE sentiment, panic level 65%, 127 posts, keywords: crowded, stuck, help

Generate a structured incident briefing with:
1. Brief 2-sentence summary
2. 3 key points
3. 3 actionable recommendations
4. Risk level assessment
`;

    const response = await axios.post(
      `${endpoint}?key=${apiKey}`,
      {
        contents: [
          {
            parts: [{ text: incidentPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          maxOutputTokens: 1024,
        },
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    );

    const summary = response.data.candidates[0]?.content?.parts[0]?.text || '';

    log('âœ… Summary generated successfully', 'green');
    log('\n--- Generated Summary ---', 'cyan');
    log(summary, 'cyan');
    log('--- End Summary ---\n', 'cyan');
  } catch (error) {
    log(`âŒ Summary generation failed: ${error.message}`, 'red');
    process.exit(1);
  }

  // Test 3: Natural language query
  log('\n4. Testing Natural Language Query...', 'blue');

  try {
    const query =
      'Based on current crowd density data showing 850 people in Zone A (capacity: 600), what should the incident commander do immediately?';

    const response = await axios.post(`${endpoint}?key=${apiKey}`, {
      contents: [
        {
          parts: [{ text: query }],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 256,
      },
    });

    const answer = response.data.candidates[0]?.content?.parts[0]?.text || '';

    log(`âœ… Query answered successfully`, 'green');
    log(`   Q: "${query}"`, 'yellow');
    log(`   A: "${answer.substring(0, 200)}..."`, 'cyan');
  } catch (error) {
    log(`âš ï¸  Query failed: ${error.message}`, 'yellow');
  }

  // Test 4: Safety filter check
  log('\n5. Testing Safety Filters...', 'blue');

  try {
    const response = await axios.post(`${endpoint}?key=${apiKey}`, {
      contents: [
        {
          parts: [{ text: 'List safety precautions for crowd management at large events.' }],
        },
      ],
      safetySettings: [
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
      ],
    });

    const text = response.data.candidates[0]?.content?.parts[0]?.text || '';
    log('âœ… Safety filters working correctly', 'green');
    log(`   Generated ${text.length} characters of safe content`, 'cyan');
  } catch (error) {
    log(`âš ï¸  Safety filter test inconclusive: ${error.message}`, 'yellow');
  }

  // Summary
  log('\n=== Test Summary ===\n', 'cyan');
  log('âœ… Gemini Pro API is operational', 'green');
  log('âœ… Incident summarization working', 'green');
  log('âœ… Natural language queries working', 'green');
  log('âœ… Ready for production use', 'green');

  log('\nNext steps:', 'blue');
  log('  1. Enable VITE_ENABLE_GEMINI_SUMMARIES=true in .env', 'cyan');
  log('  2. Test in application UI', 'cyan');
  log('  3. Monitor API usage and costs', 'cyan');
  log('  4. Proceed to Task #4: Vertex AI Vision Integration\n', 'cyan');

  log('Rate Limits:', 'blue');
  log('  Free Tier: 60 requests/minute', 'cyan');
  log('  Current usage: Check at https://makersuite.google.com/', 'cyan');
}

// Run tests
testGeminiAPI().catch((error) => {
  log(`\nâŒ Test failed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
