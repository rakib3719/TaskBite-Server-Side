const express = require('express')
const cors = require("cors")
require('dotenv').config()
const jwt = require("jsonwebtoken")
const port = process.env.PORT || 5000;
const app = express();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
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
    await client.connect();
    // Send a ping to confirm a successful connection


const userCollection = client.db('taskBite').collection('users')
const taskCollection = client.db('taskBite').collection('task')
const paymentHistoryCollection = client.db('taskBite').collection('paymentHistory')

const submissionCollection = client.db('taskBite').collection('submissionInfo')
const withDrawCollection = client.db('taskBite').collection('withDrawCollecton')
const notificationCollection = client.db('taskBite').collection('notificationInfo')



// verify


// verify admin

const verifyAdmin = async (req, res, next) => {

    const user = req.decoded
    const query = { email: user?.email }
    const result = await userCollection.findOne(query)

    if (!result || result?.role !== 'admin')
      return res.status(403).send({ message: 'Forbidden access!!' })

    next()
  }

// verify worker

const verifyWorker= async (req, res, next) => {

  const user = req.decoded
  const query = { email: user?.email }
  const result = await userCollection.findOne(query)

  if (!result || result?.role !== 'worker')
    return res.status(403).send({ message: 'Forbidden access!!' })

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


// verify creator

const verifyCreator= async (req, res, next) => {

    const user = req.decoded
    const query = { email: user?.email }
    const result = await userCollection.findOne(query)

    if (!result || result?.role !== 'taskCreator')
      return res.status(403).send({ message: 'Forbidden access!!' })

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

return res.status(401).send({message: 'Unauthorized access'})

}


const token = req.headers.authorization.split(' ')[1];


jwt.verify(token, process.env.TOKEN_SECRET,(err, decoded)=>{

if(err){
    return res.status(400).send({message: 'Bad Request'})
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

app.put('/workerCoinUpdate', verifyToken, verifyCreator, async(req, res)=>{

const workerInfo = req.body;
const workerEmail = workerInfo.workerEmail;

const query = {email: workerEmail};

const findPrevCoin = await userCollection.findOne(query);
const prevCoin = findPrevCoin.coin ;
const updatedCoin = workerInfo.upCoin + prevCoin;

const updateCoin = {
  $set: {
  coin: updatedCoin
  },
};

const result =await userCollection.updateOne(query, updateCoin);
res.send(result)




})
// update status

app.put('/updateStatus/:id',verifyToken,verifyCreator, async(req, res)=>{

  const id = req.params.id;
  const status = req.body.status;
const query = {_id: new ObjectId(id)};


const updateStatus = {
  $set: {
   status:status
  },
};


const result = await submissionCollection.updateOne(query, updateStatus)
res.send(result)

})

// worker api

app.get('/taskDetails/:id',async (req, res)=>{

const id = req.params.id;
const query = {_id: new ObjectId(id)};
const result = await taskCollection.findOne(query);
res.send(result)

})



// submission related api

app.post('/addSubmission',verifyToken,verifyWorker, async(req, res)=>{



const submissionData = req.body;

  if(submissionData.worker_email !== req.decoded.email){
    return res.status(403).send({message: "forbidden access"})
}

const result = await submissionCollection.insertOne(submissionData)
res.send(result)

})

// get submission

app.get('/mySubmissionData/:email',verifyToken, verifyWorker, async(req, res)=>{
const email = req.params.email;
if(req.decoded.email !== email){
  return res.status(403).send({message: "forbidden access"})
}
const page = parseInt(req.query.currentPage);
const skip = parseInt(req.query.limit);




const query = { worker_email : email};
const result = await submissionCollection.find(query).skip(page * skip).limit(skip).toArray();
res.send(result)

})




app.get(`/totalSubmission/:email`, verifyToken, verifyWorker, async(req, res)=>{

const email = req.params.email;
if(email!== req.decoded.email){
  res.status(403).send({message: "Forbidden access"})
}
const query = {worker_email: email}

const result =await submissionCollection.countDocuments(query)
res.send({ count: result })


})

app.get('/approvedData/:email', verifyToken, verifyWorker, async(req, res)=>{
  const email = req.params.email;
  if(email!== req.decoded.email){
    res.status(403).send({message: "Forbidden access"})
  }
  const query = {worker_email: email,
    status: 'approved'
  }
  const result = await submissionCollection.find(query).toArray()
  res.send(result)

})

// creator 


app.get('/allPendingData/:email', verifyToken, verifyCreator, async(req, res)=>{

const email = req.params.email;
if(req.decoded.email !== email){
  return res.status(403).send({message: "forbidden access"})
}


const query = {
  status: "pending",
  
creator_email:email
              
}
const result = await submissionCollection.find(query).toArray();
res.send(result)


})

// creator 

// worker api end


// taskRelated api
//  verify creator
// creator api
 app.post('/addTask',verifyToken,verifyCreator, async (req, res)=>{



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

  // worker task related api

  app.get('/allTask', verifyToken, async(req, res)=>{

    const result = await taskCollection.find().toArray();
    res.send(result)


  })

app.get('/getTask/:id', verifyToken, verifyCreator, async(req,res)=>{

const id = req.params.id;


const query = {_id: new ObjectId(id)};
const result = await taskCollection.findOne(query);
res.send(result)

})
// update task

app.put('/updateTask/:id', verifyToken, verifyCreator,async (req, res)=>{

const id = req.params.id;
const query ={_id: new ObjectId(id)}
const updatedTaskInfo = req.body;
console.log(  "this is update", updatedTaskInfo);
const updatedTask = {

  $set:{

    
title:updatedTaskInfo.title,

task_Detail: updatedTaskInfo.task_Detail,

submission_Details: updatedTaskInfo.submission_Details
  },
}

const result = await taskCollection.updateOne(query, updatedTask);
res.send(result)

})


// payment related api

// payment history

app.post('/paymentHistory',verifyToken, async(req, res)=>{

const paymentInfo = req.body;
const result = await paymentHistoryCollection.insertOne(paymentInfo);
res.send(result)


});




app.get(`/paymentHistory/:email`, async (req, res)=>{

const email = req.params.email;
const query = {email: email};
const result = await paymentHistoryCollection.find(query).toArray()
res.send(result)

})

app.get('/totalPayment/:email',verifyToken,verifyCreator, async (req, res) => {
  const email = req.params.email;
  const query = { email: email };
  

  const payments = await paymentHistoryCollection.find(query).toArray();
  

  const paidAmounts = payments.map(payment => payment.paid_amount);

  res.send(paidAmounts);
});



// withDraw related api


app.post('/withDraw', verifyToken,verifyWorker, async(req, res)=>{


const withDrawInfo = req.body;
if(req.decoded.email !== withDrawInfo.worker_email){

  
  res.status(403).send({message:"Forbidden access"})
}
const result = await withDrawCollection.insertOne(withDrawInfo);
res.send(result)

})



// admin related api
app.get('/workerUser/:email', verifyToken, verifyAdmin, async(req, res)=>{

  const email = req.params.email;

  if(req.decoded.email !== email){
    return res.status(403).send({massage:"forbidden access"})
  }
  const query = {role:'worker'};
  const result = await userCollection.find(query).toArray();
  res.send(result)
} )


app.delete('/deleteUser/:email', verifyToken, verifyAdmin, async(req,res)=>{

const email = req.params.email;
const query = {email: email};

const result = await userCollection.deleteOne(query);
res.send(result)

})
app.get('/task/:email', verifyToken, verifyAdmin, async(req,res)=>{
  const email = req.params.email;

  if(req.decoded.email !== email){
    return res.status(403).send({massage:"forbidden access"})
  }

  const result = await taskCollection.find().toArray();
  res.send(result)


} )

app.delete('/taskDeleteAdmin/:id', verifyToken, verifyAdmin, async(req, res)=>{

const id = req.params.id;
const query = {_id :new ObjectId(id)};
const result = await taskCollection.deleteOne(query);
res.send(result)

})

// update user


app.put('/updateUser', verifyToken, verifyAdmin,async(req, res)=>{

const updatedInfo = req.body;
const email = updatedInfo.email;
const query = {email: email};
const updatedRole = {


  $set:{
role: updatedInfo.role

  }
}

const result = await userCollection.updateOne(query, updatedRole);
res.send(result)

})


app.get('/adminStatesInfo', verifyToken, verifyAdmin, async(req, res)=>{

const totalUsers = await userCollection.countDocuments();

const allUser = await userCollection.find().toArray();
const totalCoin = allUser.map(user => user.coin);
const payments = await paymentHistoryCollection.find().toArray();
  

const paidAmounts = payments.map(payment => payment.paid_amount);
res.send({

  totalUsers,
  totalCoin,
  paidAmounts
})


})
// withdraw request
app.get('/withdrawRequest', verifyToken, verifyAdmin, async(req, res)=>{

const result = await withDrawCollection.find().toArray();
res.send(result)


})


app.put('/updateCoin', verifyToken, verifyAdmin, async(req,res)=>{

const coinData = req.body;
console.log(coinData);

const workerEmail = coinData.workerEmail;

const query = {email: workerEmail};

const minusCoin = parseInt(coinData.coin);
console.log(minusCoin);

const updatedCoin = {



    $inc: {coin: - minusCoin }


}

const result = await  userCollection.updateOne(query, updatedCoin);
res.send(result)

})

app.delete('/deleteWithdrawList/:id', verifyToken, verifyAdmin, async (req, res) => {
  const id = req.params.id
  const query = { _id: new ObjectId(id) }
  const result = await withDrawCollection.deleteOne(query)
  res.send(result)
})


// home page 

app.get('/topUser', async(req, res)=>{
  const filter = {role: 'worker'}

const result = await userCollection.find(filter).sort({coin:-1}).limit(6).toArray();
res.send(result)

})

app.get('/complition/:email', async(req, res)=>{
  const email = req.params.email;
  const query = {
    email:email,
    status:"approved"
   
  };
  const result = await submissionCollection.countDocuments(query);
  res.send({count:result})
})


// notification

app.post('/notification', verifyToken,  async(req, res)=>{

  const notificationDetals = req.body;
  const result = await notificationCollection.insertOne(notificationDetals);
  res.send(result)
  
  })

  app.get('/notification/:email',verifyToken, async(req, res)=>{

const email = req.params.email;

const query = {toEmail: email}
const result = await notificationCollection.find(query).toArray();
res.send(result);

  })

// payment intent



app.post("/create-payment-intent",async(req, res)=>{

  const {price} = req.body;
  const amount = parseInt(price * 100);

  const paymentIntent = await stripe.paymentIntents.create({


    amount:amount,
    currency: "usd",
    payment_method_types: ['card']



  })
  res.send({

    clientSecret: paymentIntent.client_secret

  })

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