const { Kafka}  = require('kafkajs');

async  function produce(){
    const kafka = new Kafka({
        clientId:'sdlms',
        brokers:['127.0.0.1:9092']
    })
    
    const _event =  'click';
    const producer = kafka.producer();
    await producer.connect();
    console.log('Producer Connected');
    let i = 0;
   setInterval(async() => {
    i++;
    console.log(`Sending auto genrated message: ${i}`)
    var data = await producer.send({
        topic:'sdlms',
        messages:[{
            value:_event
        }]
    });
    console.log(`Data Send to topic sdlms- ${i} - ${JSON.stringify(data)}`);
   }, 2000);
  
}
produce();