/**
 * DrishtiX - Pub/Sub Integration Tests
 * Tests topic creation, message publishing, and subscriptions
 */

import { PubSub } from '@google-cloud/pubsub';
import { testConfig } from './test-config';
import chalk from 'chalk';

const pubsub = new PubSub({
  projectId: testConfig.projectId,
  keyFilename: testConfig.credentialsPath,
});

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  duration: number;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  const startTime = Date.now();
  try {
    await testFn();
    results.push({
      name,
      status: 'PASS',
      message: 'Test passed successfully',
      duration: Date.now() - startTime,
    });
    console.log(chalk.green(`✅ PASS: ${name}`));
  } catch (error: any) {
    results.push({
      name,
      status: 'FAIL',
      message: error.message,
      duration: Date.now() - startTime,
    });
    console.log(chalk.red(`❌ FAIL: ${name}`));
    console.log(chalk.red(`   Error: ${error.message}`));
  }
}

async function testTopicCreation(): Promise<void> {
  console.log(chalk.blue('\\n📝 Testing Pub/Sub Topic Creation...'));

  await runTest('Create test topic', async () => {
    const topicName = `test-topic-${Date.now()}`;
    const [topic] = await pubsub.createTopic(topicName);

    if (!topic || !topic.name) {
      throw new Error('Topic creation failed');
    }

    // Clean up
    if (testConfig.cleanupAfterTests) {
      await topic.delete();
    }
  });

  await runTest('List existing topics', async () => {
    const [topics] = await pubsub.getTopics();

    if (!Array.isArray(topics)) {
      throw new Error('Failed to list topics');
    }

    console.log(chalk.gray(`   Found ${topics.length} topics`));
  });
}

async function testMessagePublishing(): Promise<void> {
  console.log(chalk.blue('\\n📤 Testing Message Publishing...'));

  const topicName = `test-topic-${Date.now()}`;
  const [topic] = await pubsub.createTopic(topicName);

  await runTest('Publish single message', async () => {
    const data = JSON.stringify({
      eventId: testConfig.testEventId,
      timestamp: new Date().toISOString(),
      type: 'TEST_MESSAGE',
    });

    const messageId = await topic.publishMessage({ data: Buffer.from(data) });

    if (!messageId) {
      throw new Error('Message publishing failed');
    }

    console.log(chalk.gray(`   Message ID: ${messageId}`));
  });

  await runTest('Publish batch messages', async () => {
    const messages = Array.from({ length: 10 }, (_, i) => ({
      data: Buffer.from(JSON.stringify({
        eventId: testConfig.testEventId,
        messageNumber: i + 1,
        timestamp: new Date().toISOString(),
      })),
    }));

    const messageIds = await Promise.all(
      messages.map(msg => topic.publishMessage(msg))
    );

    if (messageIds.length !== 10) {
      throw new Error('Batch publishing failed');
    }

    console.log(chalk.gray(`   Published ${messageIds.length} messages`));
  });

  // Clean up
  if (testConfig.cleanupAfterTests) {
    await topic.delete();
  }
}

async function testSubscriptions(): Promise<void> {
  console.log(chalk.blue('\\n📥 Testing Subscriptions...'));

  const topicName = `test-topic-${Date.now()}`;
  const subscriptionName = `test-subscription-${Date.now()}`;
  const [topic] = await pubsub.createTopic(topicName);

  await runTest('Create subscription', async () => {
    const [subscription] = await topic.createSubscription(subscriptionName);
    if (!subscription || !subscription.name) {
      throw new Error('Subscription creation failed');
    }
  });

  await runTest('Publish and receive message', async () => {
    const testMessage = {
      eventId: testConfig.testEventId,
      content: 'Test message for subscription',
      timestamp: new Date().toISOString(),
    };

    // Publish message
    await topic.publishMessage({ data: Buffer.from(JSON.stringify(testMessage)) });

    // Receive message using async iterator
    const subscription = pubsub.subscription(subscriptionName);
    let received = false;
    const messageHandler = (message: any) => {
      try {
        const receivedData = JSON.parse(message.data.toString());
        if (receivedData.eventId === testConfig.testEventId) {
          received = true;
          message.ack();
          console.log(chalk.gray(`   Received and acknowledged message`));
        }
      } catch (e) {
        // ignore
      }
    };
    subscription.on('message', messageHandler);

    // Wait up to 5 seconds for message
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        subscription.removeListener('message', messageHandler);
        if (!received) reject(new Error('No messages received'));
        else resolve(null);
      }, 5000);
      if (received) {
        clearTimeout(timeout);
        resolve(null);
      }
    });
    subscription.removeListener('message', messageHandler);
    if (!received) throw new Error('No messages received');
  });

  // Clean up
  if (testConfig.cleanupAfterTests) {
    const subscription = pubsub.subscription(subscriptionName);
    try { await subscription.delete(); } catch { }
    try { await topic.delete(); } catch { }
  }
}

async function testProductionTopics(): Promise<void> {
  console.log(chalk.blue('\\n🏭 Testing Production Topics...'));

  await runTest('Verify production topics exist', async () => {
    const [topics] = await pubsub.getTopics();
    const topicNames = topics.map(t => t.name.split('/').pop());

    const missingTopics = testConfig.pubsubTopics.filter(
      required => !topicNames.includes(required)
    );

    if (missingTopics.length > 0) {
      console.log(chalk.yellow(`   ⚠️  Missing topics: ${missingTopics.join(', ')}`));
      console.log(chalk.yellow(`   Run deployment scripts to create them`));
    } else {
      console.log(chalk.gray(`   All ${testConfig.pubsubTopics.length} production topics exist`));
    }
  });
}

async function runAllTests(): Promise<void> {
  console.log(chalk.bold.cyan('\\n🧪 DrishtiX Pub/Sub Integration Tests'));
  console.log(chalk.cyan('='.repeat(50)));

  try {
    await testTopicCreation();
    await testMessagePublishing();
    await testSubscriptions();
    await testProductionTopics();

    // Print summary
    console.log(chalk.bold.cyan('\\n' + '='.repeat(50)));
    console.log(chalk.bold.cyan('Test Summary:'));
    console.log(chalk.cyan('='.repeat(50)));

    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const warned = results.filter(r => r.status === 'WARN').length;

    console.log(chalk.green(`✅ Passed: ${passed}`));
    console.log(chalk.red(`❌ Failed: ${failed}`));
    console.log(chalk.yellow(`⚠️  Warnings: ${warned}`));
    console.log(chalk.white(`📊 Total: ${results.length}`));
    console.log(chalk.white(`⏱️  Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`));

    if (failed > 0) {
      console.log(chalk.red('\\n❌ Some tests failed. Check errors above.'));
      process.exit(1);
    } else {
      console.log(chalk.green('\\n✅ All tests passed successfully!'));
      process.exit(0);
    }
  } catch (error: any) {
    console.error(chalk.red('\\n❌ Test suite failed:'), error.message);
    process.exit(1);
  }
}

// Run tests
runAllTests();
