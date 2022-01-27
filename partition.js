const { Kafka}  = require('kafkajs');

async  function createPartition(){
    const kafka = new Kafka({
        clientId:'sdlms',
        brokers:['127.0.0.1:9092']
    })
    const admin = kafka.admin();
    await admin.connect();

    admin.createTopics({
        topics:[
            {
                topic:'sdlms',
                numPartitions:2
            }
        ]
    });
    await admin.connect();
    console.log('Topic created successfully');
    await admin.disconnect();
    console.log('Disconnected');

}
createPartition();