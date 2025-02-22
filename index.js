require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const e = require("cors");

const app = express();
const port = process.env.PORT || 8080;

// MIDDLEWARE
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://do-task-atiq.firebaseapp.com",
      "https://do-task-atiq.web.app",
    ],
  })
);

app.use(express.json());

// Set Cross-Origin Opener Policy and Embedder Policy
// app.use(express.static('public', {
//   setHeaders: (res) => {
//     res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
//     res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
//   }
// }));

const verify = (req, res, next) => {
  const token = req.headers.token?.split(" ")[1];
  // console.log(req.headers)

  if (!token) {
    return res
      .status(401)
      .send({ message: "Unauthorize Access, Login First!" });
  }
  jwt.verify(token, process.env.ACCESS_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ message: "Unauthorize Access, Login Again!" });
    }
    req.user = decoded;
    next();
  });
};

const isItSecure = (req, res, next) => {
  const {email} = req.headers;

  // console.log(email,req.user.email !== email)
  if (req.user.email !== email) {
    return res.status(403).send({ message: "Forbidden Access!" });
  }
  return next()
};

const isAdmin = (req, res, next) => {
  const {role} = req.headers;

  if (role !== "admin") {
    return res.status(403).send({ message: "Forbidden Access!" });
  }
  next()
};


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(process.env.MONGO_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: false,
    deprecationErrors: true,
  },
});

async function run() {
  try {

    const users = client.db("DoTask").collection("Users");
    users.createIndex(
      { name: "text", email: "text", role: "text" },
      { name: "name_text_email_text_role_text" }
    );
    const tasks = client.db("DoTask").collection("Tasks");


    const matchFromDB = async (req, res, next) => {
      const {email} = req.headers
      // console.log(email,role)

        try {
          const USER = await users.findOne({ email });
          // console.log(!USER)
          if (!USER) {
            return res.status(403).send({ message: "Forbidden Access!" });
          }
          next()
        } catch (error) {
          console.error('Error checking user role:', error);
          return res.status(500).send({ message: 'Server error' });
        }

    };

    // Auth with jwt

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_SECRET, {
        expiresIn: "3d",
      });
      res.json(token);
    });

    // User

    app.post("/users",async (req,res)=>{
      const {image,name,email,role}=req.body;
      try {
        const userFound= await users.findOne({email})
        if(userFound){
          return res.status(200).send("User found")
        }
        const result= await users.insertOne({image,name,email,role})
        console.log(`A user was successfully inserted with id: ${result.insertedId}`)
        res.status(201).json({message:"User Insertion successful",insertedId:result.insertedId})

      } catch (error) {
        console.error(`Failed to insert user: ${error}`);
        res.status(500).send("Failed to insert user.");
      }
    })

    app.get("/users",verify,isItSecure,isAdmin,matchFromDB, async (req, res) => {
      let { query={}, limit="0", sort={} } = req.query;

      try {
        const result =await users.find(query).limit(Number(limit)).sort(sort).toArray()
        res.status(200).json(result)
      } catch (error) {
        console.error(`Failed to find users: ${error}`);
        res.status(500).send("Failed to find users.");
      }
    });

    app.get("/users/:email",verify,isItSecure,async (req,res)=>{
      const email=req.params.email;
      try {
        const result= await users.findOne({email})
        res.status(200).json(result)
      } catch (error) {
        console.error(`Failed to find user: ${error}`);
        res.status(500).send("Failed to find user.");
      }
    })

    app.put("/users/:email",verify,isItSecure,matchFromDB,async (req,res)=>{
      const {email} = req.headers
      let credentials = req.body;
  
      const query={email}
      const update = {
        $set: credentials
      };
      const options = { upsert: false };
  
      try {
        const result= await users.updateOne(query,update,options)
        console.log(
          `${result.modifiedCount} user with the email: ${email} was updated.`
        );
        res.status(200).send(`${result.modifiedCount} user updated.`);
      } catch (error) {
        console.error(`Failed to update user: ${error}`);
        res.status(500).send("Failed to update user.");
      }

    })

    app.put("/changeUserRole/:_id",verify,isItSecure,isAdmin,matchFromDB, (req, res) => {
      let _id = new ObjectId(req.params._id);
      let {role} = req.body;

      const query = { _id };
      const update={
        $set: {role}
      }
      const options = { upsert: false };

      users
        .updateOne(query, update, options)
        .then((result) => {
          console.log(
            `Role of a user with the _id: ${req.params._id} was Updated to ${role}.`
          );
          res.status(200).send(`${result.modifiedCount} user's role updated`);
        })
        .catch((error) => {
          console.error(`Failed to Update user role: ${error}`);
          res.status(500).send(`Failed to Update user role`);
        });
    });

    app.get("/userRole-counts",verify,isItSecure,isAdmin,matchFromDB, async (req, res) => {
      const pipeline=[
        {
          $group: {
            _id: "$role", 
            count: { $sum: 1 }, 
          },
        },
        {
            $project: {
            count: 1,
            role: "$_id", 
            _id: 0, 

          },
        },
      ]
      try {
        let roleCounts = await users.aggregate(pipeline).toArray()
        const totalUsers = await users.countDocuments();
        roleCounts =roleCounts.map(data=>{
          return {name:data.role, value:data.count}
        })
        res.json({ roleCounts, totalUsers });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
      }
    });

  // Task

  app.post("/tasks", verify, isItSecure, matchFromDB, async (req, res) => {
    let credentials = req.body;

    credentials={...credentials,lastUpdate:new Date(),status:"to-do"}
    try {
      const review= await tasks.insertOne(credentials)
      console.log(`A task was added with the _id: ${review.insertedId}`);
      res.status(201).send(`Task was added`);

    } catch (error) {
      console.error(`Failed to add task: ${error}`);
      res.status(500).send("Failed to add task.");
    }
  });



  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`SERVER IS RUNNING AT PORT: ${port}`);
});
