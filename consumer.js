const { Kafka}  = require('kafkajs');

async  function consume(){
    const kafka = new Kafka({
        clientId:'sdlms',
        brokers:['127.0.0.1:9092']
    })

    const consumer = kafka.consumer({groupId:"sdlms"});
    await consumer.connect();
    console.log('Consumer Connected');
    consumer.subscribe({
        topic:'sdlms',
        fromBeginning:true
    });
    await consumer.run({
        eachMessage:async(data)=>{
            console.log(`$${JSON.stringify(data.message.value.toString())} `)
        }
    })
}
consume();