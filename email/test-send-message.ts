// test-send-nestjs-format.ts
import * as amqp from 'amqplib';

async function sendTestMessage() {
  let connection;
  try {
    console.log('🔗 Connecting to RabbitMQ at amqp://localhost:5672...');
    connection = await amqp.connect('amqp://localhost:5672');
    const channel = await connection.createChannel();
    
    console.log('📋 Setting up exchange and queue...');
    // Assert the exchange
    await channel.assertExchange('notifications.direct', 'direct', { durable: true });
    
    // Assert the queue
    await channel.assertQueue('email.queue', {
      durable: true,
      deadLetterExchange: 'notifications.direct',
      deadLetterRoutingKey: 'failed.queue'
    });
    
    // Bind queue to exchange
    await channel.bindQueue('email.queue', 'notifications.direct', 'email.queue');

    // NestJS microservice expects this format
    const message = {
      pattern: { cmd: 'email_notification' },
      data: {
        notification_type: 'email',
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        template_code: 'welcome',
        variables: {
          name: 'John Doe',
          link: 'https://example.com',
        },
        request_id: 'test-request-' + Date.now(),
        priority: 1,
      }
    };

    console.log('📤 Sending test message in NestJS format...');
    const sent = channel.publish(
      'notifications.direct', 
      'email.queue', 
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
    
    if (sent) {
      console.log('✅ Test message sent successfully to email.queue');
      console.log('📨 Message content:', JSON.stringify(message, null, 2));
    } else {
      console.log('❌ Failed to send message');
    }
    
    await channel.close();
    await connection.close();
    console.log('🔌 Connection closed');
    
    console.log('✅ Test completed! Check your NestJS service logs for message processing.');
    
  } catch (error: any) {
    console.error('❌ Error sending test message:', error.message);
    if (connection) await connection.close();
    process.exit(1);
  }
}

sendTestMessage();