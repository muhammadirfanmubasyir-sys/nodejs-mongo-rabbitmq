const amqp = require('amqplib');

let channel, connection, queueName = 'task_queue';

async function start() {  
    
        try {
            //change to "rabbitmq" which is the service name in docker-compose 
            // or else use "127.0.0.1" if running locally without docker
            connection = await amqp.connect('amqp://rabbitmq:5672');  
            
            channel = await connection.createChannel();
            console.log('Channel created ? :', channel ? 'Success' : 'Failed');
            await channel.assertQueue(queueName);
            console.log('Notification Service is Listening to messages !!!');

            channel.consume(queueName, (msg) => {
                if (msg !== null) {
                    console.log('Received message:', msg.content.toString());
                    
                    const taskData = JSON.parse(msg.content.toString());
                    console.log('Notification Service NEW TASK : ', taskData);
                    console.log('Notification Service NEW TASK - title :', taskData.title,
                         ', description:', taskData.description, ', User ID:', taskData.userId);

                    channel.ack(msg);
                }       
            });

        } catch (error) {
            console.error('Failed to connect to RabbitMQ', error);
 
        }
      
    if (!channel) {
        console.error('Could not establish connection to RabbitMQ after multiple attempts. Exiting.');
        process.exit(1); // Exit the application if connection cannot be established
    }

}

 
start();
 