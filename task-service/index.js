const express = require('express');
const mongoose = require('mongoose');
const amqp = require('amqplib');


const app = express();
const port = 3002;

app.use(express.json());


app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// "mongo" is docker-compose service name for MongoDB, and 27017 is the default MongoDB port
// or use "localhost" if running without docker
mongoose.connect('mongodb://mongo:27017/user-service').then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Failed to connect to MongoDB', err);
    panic(err);
});

const TaskSchema = new mongoose.Schema({
    title: String,
    description: String,
    userId: String,
    createdAt: { type: Date, default: Date.now },

});

const Task = mongoose.model('Task', TaskSchema);

let channel, connection, queueName = 'task_queue';

async function connectRabbitMQWithRetries(retries = 5, delay = 3000) {  
    while (retries > 0) {
        try {
            //change to "rabbitmq" which is the service name in docker-compose 
            // or else use "127.0.0.1" if running locally without docker
            connection = await amqp.connect('amqp://rabbitmq:5672'); 
            
            channel = await connection.createChannel();
            console.log('Channel created ? :', channel ? 'Success' : 'Failed');
            await channel.assertQueue(queueName);
            console.log('Connected to RabbitMQ and channel created successfully !!!');
            return; // Exit function after successful connection

        } catch (error) {
            console.error('Failed to connect to RabbitMQ', error);
            retries--;
            console.log(`Retrying again in ${delay}ms... (${retries} retries left)`);
            await new Promise(res => setTimeout(res, delay));
        }
       // retries = 0; // Exit loop after successful connection
    }  

    if (!channel) {
        console.error('Could not establish connection to RabbitMQ after multiple attempts. Exiting.');
        process.exit(1); // Exit the application if connection cannot be established
    }

    /*
    amqp.connect(`amqp://127.0.0.1`, (err, connection) => {
    if (err) throw err;
        connection.createChannel((err, channel) => {
            const queueName = 'queue';
            const message = 'This is the message to send'
            channel.assertQueue(queueName, {
                durable:false,
            });
            channel.sendToQueue(queueName, Buffer.from(message));
            console.log('Message: ' + message);
            setTimeout(()=>{
                connection.close();
            }, 1000);
        });
    });
    */
}

app.post('/tasks', async (req, res) => {        
    const { title, description, userId } = req.body;
    const task = new Task({ title, description, userId });

    try {   
        await task.save();
        console.log('IN POST /tasks : Task saved Id : ', task._id);

        if (!channel) {
            console.error('RabbitMQ channel is not available. Task will not be sent to the queue.');
            return res.status(500).json({ error: 'RabbitMQ channel is not available' });
        }

        const message = JSON.stringify({ taskId: task._id, userId, title, description });
        channel.sendToQueue(queueName, Buffer.from(message), { persistent: true });
        console.log('Sent task to RabbitMQ:', message);

        res.status(201).json(task);
    } catch (error) {
        console.error('Error saving task:', error);
        res.status(500).json({ error: 'Failed to save task' });
    }    
}); 

app.get('/tasks', async (req, res) => {
    const tasks = await Task.find();

    console.log('IN GET /tasks : Tasks retrieved:', tasks.length);
    res.json(tasks);
    
});




app.get('/', (req, res) => {
    res.send('Hello, From User Service ! 😎');
});

app.listen(port, () => {
    console.log(`Task service is running on http://localhost:${port}`);
    connectRabbitMQWithRetries();
}); 

