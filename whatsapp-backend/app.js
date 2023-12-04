// importing
import express from 'express'
import mongoose from 'mongoose'
import Messages from './dbMessages.js'
import Pusher from 'pusher'
import cors from 'cors'

//app config
const app = express()
const port = process.env.PORT || 9000;

const pusher = new Pusher({
  appId: "1719463",
  key: "d2bcaa4ba3dd920bc06e",
  secret: "c959f3140848218cfd86",
  cluster: "ap2",
  useTLS: true
});


//middleware
app.use(express.json());

//header middleware
// app.use((req,res,next) => {
//   res.setHeader("Access-Control-Allow-Origin","*");
//   res.setHeader("Access-COntrol-Allow-Headers","*");
//   next();
// });
app.use(cors());

//DB config
const connection_url='mongodb+srv://ahrarhussain:xbcO0gvqm91g4ta1@cluster0.yahfv.mongodb.net/whatsappdb?retryWrites=true&w=majority'
mongoose.connect(connection_url,{
})

//Change stream

const db =mongoose.connection;

db.once("open", () => {
  console.log("Db connected");

  const msgCollection=db.collection("messagecontents");
  const changeStream = msgCollection.watch();

  changeStream.on("change",(change) => {
    console.log("A Change occured",change);

    if(change.operationType=='insert'){
      const messageDetails=change.fullDocument;
      pusher.trigger('messages','inserted', {
        name:messageDetails.name,
        message:messageDetails.message,
        timestamp:messageDetails.timestamp,
        received:messageDetails.received
      });
    }else{
      console.log("Error triggering pusher");
    }
  });
});



//api routes
app.get("/",(req,res) => res.status(200).send("Hello World"));

//api that gives back the data from database
app.get("/messages/sync",(req,res) =>{
  Messages.find((err,data) => {
    if(err){
      res.status(500).send(err);
    }else{
      res.status(200).send(data);
    }
  });
});

app.post('/messages/new',(req,res) => {
  const dbMessage = req.body

  Messages.create(dbMessage, (err,data) => {
    if(err){
      res.status(500).send(err)
    }else{
      res.status(201).send(data)
    }
  })
})

//listen
app.listen(port,() => console.log(`Listening on localhost:${port}`));
