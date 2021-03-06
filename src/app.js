import express from 'express'
import cors from 'cors'
import dayjs from 'dayjs';


const app = express()
app.use(cors())
app.use(express.json())

let participants = []
const messages = []

//console.log(participants)




app.post("/participants", (req,res)=>{
   const newParticipant = req.body
    const alreadyExist = participants.find((participant)=>participant.name===newParticipant.name)
    const {name} = newParticipant

    if(name.length===0){
        res.sendStatus(400)
        return
    }

    if(alreadyExist){
        res.send('Nome já ocupado')
        return
    }

    newParticipant["lastStatus"] = Date.now()
    participants.push(newParticipant) 
    
    


    const enterMessage = {
        from: name,
        to: 'Todos',
        text: 'entra na sala...',
        type: 'status',
        time: dayjs(newParticipant.lastStatus).format('HH:mm:ss')
    }
    messages.push(enterMessage)
    res.sendStatus(200)
    
})

app.get("/participants", (req, res) => {
    res.send(participants);
});

app.post("/messages", (req, res) => {
    const newMessage = req.body;
    const { to, text, type } = newMessage;
    const from = req.headers.user;
    const typeValidation =  type === 'message' || type === 'private_message';
    if(to.length === 0 || text.length === 0 || from.length === 0 || !typeValidation){
        res.sendStatus(400);
        return;
    }
    newMessage.from = from;
    newMessage.time = dayjs(Date.now()).format('HH:mm:ss');
    messages.push(newMessage);
    res.sendStatus(200);
});


app.get("/messages", (req, res) => {
    let limit = req.query.limit;
    const user = req.headers.user;
    const filteredMessages = messages.filter(message => message.type === 'message' || message.type === 'status' || (message.type === 'private_message' && (message.from === user || message.to === user)))
    // console.log(req.headers)
    // console.log(req.query)
    // console.log(limit)
   
    if(!limit){
        res.send(filteredMessages);
    }
    else{
        const reverseFilteredMessages = filteredMessages.reverse();
        let limitFilteredMessages = []
        for( let i = 0; i< reverseFilteredMessages.length; i++){
            limitFilteredMessages.push(reverseFilteredMessages[i]) ;
            if(limitFilteredMessages.length === limit){
                res.send(limitFilteredMessages.reverse());
                return;
            }
        }
        res.send(limitFilteredMessages.reverse());
    }        
});


app.post("/status", (req, res) => {
    const user = req.headers.user;
    if(!participants.find(message => message.name === user)){
        res.sendStatus(400);
    }
    let online = []
    for(let i = 0; i < participants.length; i++){
        if(participants[i].name === user){
            participants[i].lastStatus = Date.now();
            online.push(participants[i]);
        }
        else{
            online.push(participants[i]);
        }
    }
    participants = [...online];
    res.sendStatus(200);
});

setInterval(()=>{
    let online = [];
    for(let i = 0; i < participants.length; i++){
        if(Date.now() - participants[i].lastStatus <= 10000){
            online.push(participants[i]);
        }
        else{
            messages.push(
                {
                    from: participants[i].name, 
                    to: 'Todos', 
                    text: 'sai da sala...', 
                    type: 'status', 
                    time: dayjs(Date.now()).format('HH:mm:ss')
                }
            );
        }
    }
    participants = [...online];
}, 15000);

app.listen(4000, ()=>{
    console.log('server on')

})