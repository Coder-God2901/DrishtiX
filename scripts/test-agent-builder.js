/**
 * Test Script for Vertex AI Agent Builder Integration
 *
 * Prerequisites:
 * 1. Deploy Agent Builder agent (see docs/VERTEX_AI_AGENT_BUILDER_SETUP.md)
 * 2. Set VITE_VERTEX_AI_AGENT_ENDPOINT and VITE_VERTEX_AI_AGENT_ID in .env
 * 3. Set GCP access token or application credentials
 *
 * Run: node scripts/test-agent-builder.js
 */

const axios = require('axios');
require('dotenv').config();

const PROJECT_ID = process.env.VITE_GOOGLE_CLOUD_PROJECT_ID;
const LOCATION = 'us-central1';
const AGENT_ID = process.env.VITE_VERTEX_AI_AGENT_ID;
const ACCESS_TOKEN = process.env.VITE_GCP_ACCESS_TOKEN;

if (!PROJECT_ID || !AGENT_ID || !ACCESS_TOKEN) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_GOOGLE_CLOUD_PROJECT_ID');
  console.error('   - VITE_VERTEX_AI_AGENT_ID');
  console.error('   - VITE_GCP_ACCESS_TOKEN');
  console.error('\nPlease follow setup guide: docs/VERTEX_AI_AGENT_BUILDER_SETUP.md');
  process.exit(1);
}

// Test incident scenarios
const testIncidents = [
  {
    id: 'incident_001',
    type: 'medical_emergency',
    severity: 'critical',
    description: 'Person collapsed, unconscious, crowd gathering',
    location: { lat: 28.613, lon: 77.208 },
    timestamp: Date.now(),
  },
  {
    id: 'incident_002',
    type: 'crowd_surge',
    severity: 'high',
    description: 'Sudden crowd movement near main stage, potential stampede risk',
    location: { lat: 28.614, lon: 77.209 },
    timestamp: Date.now(),
  },
  {
    id: 'incident_003',
    type: 'fire_hazard',
    severity: 'critical',
    description: 'Smoke detected in food court area',
    location: { lat: 28.612, lon: 77.207 },
    timestamp: Date.now(),
  },
];

/**
 * Get access token using gcloud CLI
 */
async function getAccessToken() {
  if (ACCESS_TOKEN && ACCESS_TOKEN !== '') {
    return ACCESS_TOKEN;
  }

  const { execSync } = require('child_process');
  try {
    const token = execSync('gcloud auth print-access-token', { encoding: 'utf-8' }).trim();
    console.log('✅ Retrieved access token from gcloud CLI');
    return token;
  } catch (error) {
    console.error('❌ Failed to get access token:', error.message);
    console.error('\nRun: gcloud auth login');
    process.exit(1);
  }
}

/**
 * Test Dialogflow CX session management
 */
async function testSessionManagement() {
  console.log('\n📋 Testing Session Management...\n');

  const token = await getAccessToken();
  const sessionId = `test-session-${Date.now()}`;
  const sessionPath = `projects/${PROJECT_ID}/locations/${LOCATION}/agents/${AGENT_ID}/sessions/${sessionId}`;

  try {
    const response = await axios.post(
      `https://dialogflow.googleapis.com/v3/${sessionPath}:detectIntent`,
      {
        queryInput: {
          text: {
            text: 'Hello, I need help with incident response',
          },
          languageCode: 'en',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Session created successfully');
    console.log('   Session ID:', sessionId);
    console.log('   Response:', response.data.queryResult?.responseMessages?.[0]?.text?.text?.[0] || 'No response');

    return sessionId;
  } catch (error) {
    console.error('❌ Session management test failed:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Test incident analysis with natural language
 */
async function testIncidentAnalysis(incident) {
  console.log(`\n🚨 Testing Incident Analysis: ${incident.type}\n`);

  const token = await getAccessToken();
  const sessionId = `incident-${incident.id}-${Date.now()}`;
  const sessionPath = `projects/${PROJECT_ID}/locations/${LOCATION}/agents/${AGENT_ID}/sessions/${sessionId}`;

  const query = `
    Incident Alert: ${incident.type}
    Severity: ${incident.severity}
    Description: ${incident.description}
    Location: ${incident.location.lat}, ${incident.location.lon}
    
    What actions should be taken?
  `.trim();

  try {
    const response = await axios.post(
      `https://dialogflow.googleapis.com/v3/${sessionPath}:detectIntent`,
      {
        queryInput: {
          text: {
            text: query,
          },
          languageCode: 'en',
        },
        queryParams: {
          parameters: {
            incidentId: incident.id,
            incidentType: incident.type,
            severity: incident.severity,
            location: incident.location,
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Incident analyzed successfully');
    console.log('   Incident ID:', incident.id);
    console.log('   Agent Response:');

    const messages = response.data.queryResult?.responseMessages || [];
    messages.forEach((msg, idx) => {
      if (msg.text?.text) {
        console.log(`   ${idx + 1}. ${msg.text.text[0]}`);
      }
    });

    // Check for function calls
    if (response.data.queryResult?.diagnosticInfo?.['Execution Sequence']) {
      console.log('\n   Function Calls Detected:');
      const executionSeq = response.data.queryResult.diagnosticInfo['Execution Sequence'];
      console.log('   ', JSON.stringify(executionSeq, null, 2));
    }

    return response.data;
  } catch (error) {
    console.error('❌ Incident analysis failed:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Test multi-turn conversation
 */
async function testMultiTurnConversation() {
  console.log('\n💬 Testing Multi-Turn Conversation...\n');

  const token = await getAccessToken();
  const sessionId = `conversation-${Date.now()}`;
  const sessionPath = `projects/${PROJECT_ID}/locations/${LOCATION}/agents/${AGENT_ID}/sessions/${sessionId}`;

  const conversationSteps = [
    'I have a medical emergency at coordinates 28.613, 77.208',
    'The person is unconscious and not breathing',
    'There are about 50 people gathered around',
    'How should I coordinate the responders?',
  ];

  try {
    for (let i = 0; i < conversationSteps.length; i++) {
      console.log(`\n   User: ${conversationSteps[i]}`);

      const response = await axios.post(
        `https://dialogflow.googleapis.com/v3/${sessionPath}:detectIntent`,
        {
          queryInput: {
            text: {
              text: conversationSteps[i],
            },
            languageCode: 'en',
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const messages = response.data.queryResult?.responseMessages || [];
      messages.forEach((msg) => {
        if (msg.text?.text) {
          console.log(`   Agent: ${msg.text.text[0]}`);
        }
      });

      // Wait a bit between turns
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log('\n✅ Multi-turn conversation completed successfully');
  } catch (error) {
    console.error('❌ Multi-turn conversation failed:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Test agent health check
 */
async function testAgentHealth() {
  console.log('\n🏥 Testing Agent Health...\n');

  const token = await getAccessToken();
  const agentPath = `projects/${PROJECT_ID}/locations/${LOCATION}/agents/${AGENT_ID}`;

  try {
    const response = await axios.get(`https://dialogflow.googleapis.com/v3/${agentPath}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('✅ Agent is healthy and accessible');
    console.log('   Agent Name:', response.data.displayName);
    console.log('   Default Language:', response.data.defaultLanguageCode);
    console.log('   Time Zone:', response.data.timeZone);
    console.log('   State:', response.data.startFlow ? 'Active' : 'Inactive');

    return true;
  } catch (error) {
    console.error('❌ Agent health check failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Main test execution
 */
async function main() {
  console.log('🚀 Vertex AI Agent Builder Integration Test');
  console.log('='.repeat(60));
  console.log('Project ID:', PROJECT_ID);
  console.log('Location:', LOCATION);
  console.log('Agent ID:', AGENT_ID);
  console.log('='.repeat(60));

  const results = {
    healthCheck: false,
    sessionManagement: false,
    incidentAnalysis: [],
    multiTurn: false,
  };

  try {
    // Test 1: Agent Health
    results.healthCheck = await testAgentHealth();

    // Test 2: Session Management
    await testSessionManagement();
    results.sessionManagement = true;

    // Test 3: Incident Analysis
    for (const incident of testIncidents) {
      try {
        await testIncidentAnalysis(incident);
        results.incidentAnalysis.push(incident.id);
      } catch (error) {
        console.error(`   Failed to analyze ${incident.id}`);
      }
    }

    // Test 4: Multi-Turn Conversation
    await testMultiTurnConversation();
    results.multiTurn = true;
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results Summary');
  console.log('='.repeat(60));
  console.log(`Health Check:         ${results.healthCheck ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Session Management:   ${results.sessionManagement ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Incident Analysis:    ${results.incidentAnalysis.length}/${testIncidents.length} passed`);
  console.log(`Multi-Turn Chat:      ${results.multiTurn ? '✅ PASSED' : '❌ FAILED'}`);
  console.log('='.repeat(60));

  const allPassed =
    results.healthCheck &&
    results.sessionManagement &&
    results.incidentAnalysis.length === testIncidents.length &&
    results.multiTurn;

  if (allPassed) {
    console.log('\n✅ All tests passed! Agent Builder is ready for production.');
  } else {
    console.log('\n⚠️  Some tests failed. Check configuration and agent setup.');
  }
}

// Run tests
main().catch(console.error);
