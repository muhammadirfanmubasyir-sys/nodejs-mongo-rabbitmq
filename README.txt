BISMILLAH
=========
docker compose up -d
docker compose up -d [service-name]
docker compose up --buid  -d          => REBUILD THE IMAGES !!
docker compose down

docker compose up --build notification-service  -d
---------
docker volume ls 
local     express-mongo-rabbitmq_mongo-data
-------
docker volume rm express-mongo-rabbitmq_mongo-data

docker volume prune   => DELETE ALL LOCAL VOLUME
-------------
npm init -y

npm install express --save

npm install mongoose --save

npm install body-parser

npm install amqplib

docker run --name mongodb -p 27017:27017 -d mongodb/mongodb-community-server:latest
docker run --rm -it -p 15672:15672 -p 5672:5672 -d rabbitmq:4.3.0-management
=======================================================================================================================================================================
irfan@DESKTOP-CH2QFKL:/mnt/d/PROJECTS/node-js/express-mongo-rabbitmq$ docker ps
CONTAINER ID   IMAGE                                         COMMAND                  CREATED          STATUS          PORTS                                                                                                                                                     NAMES
9406f464bf60   express-mongo-rabbitmq-notification-service   "docker-entrypoint.s…"   11 seconds ago   Up 11 seconds   0.0.0.0:3003->3003/tcp, [::]:3003->3003/tcp                                                                                                               notification-service
8f2bcea0a9bf   express-mongo-rabbitmq-user-service           "docker-entrypoint.s…"   31 minutes ago   Up 31 minutes   0.0.0.0:3001->3001/tcp, [::]:3001->3001/tcp                                                                                                               user-service
8195d9883eb2   express-mongo-rabbitmq-task-service           "docker-entrypoint.s…"   31 minutes ago   Up 31 minutes   0.0.0.0:3002->3002/tcp, [::]:3002->3002/tcp                                                                                                               task-service
c9f8c1de6649   rabbitmq:3-management                         "docker-entrypoint.s…"   48 minutes ago   Up 31 minutes   4369/tcp, 5671/tcp, 0.0.0.0:5672->5672/tcp, [::]:5672->5672/tcp, 15671/tcp, 15691-15692/tcp, 25672/tcp, 0.0.0.0:15672->15672/tcp, [::]:15672->15672/tcp   rabbitmq
e7b437b5d2d7   mongo:latest                                  "docker-entrypoint.s…"   48 minutes ago   Up 31 minutes   0.0.0.0:27017->27017/tcp, [::]:27017->27017/tcp   
========================================================================================================================================================================
IN GET /tasks : Tasks retrieved: 4
2026-05-08T12:24:44.895Z - GET /tasks 200 - 53ms

IN POST /tasks : Task saved Id :  new ObjectId('69fdd622971e545bc4b23fc2')
Sent task to RabbitMQ: {"taskId":"69fdd622971e545bc4b23fc2","userId":"BB","title":"BB","description":"BB"}
2026-05-08T12:25:06.752Z - POST /tasks 201 - 65ms

IN GET /tasks : Tasks retrieved: 5
2026-05-08T12:25:11.456Z - GET /tasks 200 - 6ms

===================== PRODUCER (task-service: index.js) ======================
IN POST /tasks : Task saved Id :  new ObjectId('69fdd669971e545bc4b23fc3')
Sent task to RabbitMQ: {"taskId":"69fdd669971e545bc4b23fc3","userId":"CC","title":"CC","description":"CC"}
2026-05-08T12:26:17.426Z - POST /tasks 201 - 7ms

IN POST /tasks : Task saved Id :  new ObjectId('69fee24715037a0c914ccf84')
Sent task to RabbitMQ: {"taskId":"69fee24715037a0c914ccf84","userId":"TAWAKKAL-USER-ID","title":"SABAR-TITLE","description":"IKHLAS-DESC"}
2026-05-09T07:29:11.975Z - POST /tasks 201 - 5ms

================== CONSUMER (notification-service: index.js)==================

irfan@DESKTOP-CH2QFKL:/mnt/d/PROJECTS/node-js/express-mongo-rabbitmq$ docker logs -f notification-service
Channel created ? : Success
Notification Service is Listening to messages !!!

Received message: {"taskId":"69fedb0e15037a0c914ccf82","userId":"TAWAKKAL","title":"SABAR","description":"IKHLAS"}
Notification Service NEW TASK :  {
  taskId: '69fedb0e15037a0c914ccf82',
  userId: 'TAWAKKAL',
  title: 'SABAR',
  description: 'IKHLAS'
}
Notification Service NEW TASK - title : SABAR , description: IKHLAS , User ID: TAWAKKAL
--
Received message: {"taskId":"69fedbc515037a0c914ccf83","userId":"TAWAKKAL-99","title":"SABAR-99","description":"IKHLAS-99"}
Notification Service NEW TASK :  {
  taskId: '69fedbc515037a0c914ccf83',
  userId: 'TAWAKKAL-99',
  title: 'SABAR-99',
  description: 'IKHLAS-99'
}
Notification Service NEW TASK - title : SABAR-99 , description: IKHLAS-99 , User ID: TAWAKKAL-99
----
Received message: {"taskId":"69fee24715037a0c914ccf84","userId":"TAWAKKAL-USER-ID","title":"SABAR-TITLE","description":"IKHLAS-DESC"}
Notification Service NEW TASK :  {
  taskId: '69fee24715037a0c914ccf84',
  userId: 'TAWAKKAL-USER-ID',
  title: 'SABAR-TITLE',
  description: 'IKHLAS-DESC'
}
Notification Service NEW TASK - title : SABAR-TITLE , description: IKHLAS-DESC , User ID: TAWAKKAL-USER-ID