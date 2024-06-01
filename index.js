const express = require('express')
const cors = require("cors")
require('dotenv').config()
const jwt = require("jsonwebtoken")
const port = process.env.PORT || 5000;
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use
  (cors({

    origin: [
      'http://localhost:5174',
      'http://localhost:5173',
   
    ],



  }))

  app.use(express.json())







const uri = `mongodb+srv://${process.env.USER}:${process.env.PASSWORD}@cluster0.ngsjczb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection


const userCollection = client.db('taskBite').collection('users')
const taskCollection = client.db('taskBite').collection('task')



// verify


// verify admin

const verifyAdmin = async (req, res, next) => {

    const user = req.decoded
    const query = { email: user?.email }
    const result = await userCollection.findOne(query)

    if (!result || result?.role !== 'admin')
      return res.status(401).send({ message: 'unauthorized access!!' })

    next()
  }

// verify creator

const verifyCreator= async (req, res, next) => {

    const user = req.decoded
    const query = { email: user?.email }
    const result = await userCollection.findOne(query)

    if (!result || result?.role !== 'taskCreator')
      return res.status(401).send({ message: 'unauthorized access!!' })

    next()
  }







    app.post('/jwt', async (req, res) => {
        const user = req.body;
        // console.log(email);
        const token = jwt.sign(user, process.env.TOKEN_SECRET, {
          expiresIn: '365d',
        })
        res.send({token});

    })

    const verifyToken = (req, res, next)=>{

console.log(req.headers.authorization);

if(!req?.headers?.authorization){

return res.status(401).send({message: 'forbidden access'})

}


const token = req.headers.authorization.split(' ')[1];


jwt.verify(token, process.env.TOKEN_SECRET,(err, decoded)=>{

if(err){
    return res.status(401).send({message: 'forbidden access'})
} 

req.decoded = decoded;
console.log("ata decoded", req.decoded);

next()

})

    }

// user

 app.post('/userAdd',async (req,res)=>{

const userInfo = req.body;
const query ={email: userInfo?.email}
const isExist = await userCollection.findOne(query);
if(isExist){
    return res.send(isExist)
}

console.log(userInfo);
const result =await userCollection.insertOne(userInfo)
res.send(result)

 })

 app.get('/user/:email', async(req, res)=>{

const email = req.params.email;
const query = {email: email};
const result = await userCollection.findOne(query)
res.send(result)
 })
app.put('/userCoin',verifyToken,verifyCreator, async(req, res)=>{


    if(req.decoded.email !== req.body.userEmail){

return res.status(403).send({message:"Forbidden access"})

    }
const email = req.decoded.email;
const query = {email: email};
const reqCoin = req.body.updatedCoin;
const updateCoin = {

    $set: {
        coin : reqCoin
      },
};
const result = await userCollection.updateOne(query, updateCoin);
res.send(result)

})



// taskRelated api
//  verify creator
 app.post('/addTask',verifyToken,verifyCreator, async (req, res)=>{

console.log(req.body,"ji vai", req.decoded.email);

if(!req.body.creator_email  === req.decoded.email){
    return res.status(403).send({message: "forbidden access"})
}


const taskInfo = {

    ...req.body,
    creation_time : Date.now()

}


const result =await taskCollection.insertOne(taskInfo)
res.send(result)





 })


 app.get('/myTask/:email',verifyToken, verifyCreator, async(req, res)=>{

const email = req.params.email;
if(email !== req.decoded.email){

    res.status(403).send({message: "forbidden access"})
}


const query = {creator_email: email};
const result = await taskCollection.find(query).toArray();

res.send(result)


 })

 app.delete('/deleteTask/:id', verifyToken, verifyCreator, async (req, res) => {
    const id = req.params.id
    const query = { _id: new ObjectId(id) }
    const result = await taskCollection.deleteOne(query)
    res.send(result)
  })




    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req, res) => {

    res.send('taskBite serverside ready to work')
  })
  
  
  app.listen(port, () => {
  
    console.log(`this port is ${port}`);
  
  })