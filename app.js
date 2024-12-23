import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";

dotenv.config(); // Load environment variables

const app = express();
const port = process.env.PORT || 3000;

// middlewares
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@bot.jxczvgl.mongodb.net/?retryWrites=true&w=majority&appName=bot`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    // Create a database
    const database = client.db("ArtifactDB");

    // db collections
    const aftifactCollection = database.collection("NewArtifact");
    // const applyVisaCollection = database.collection("ApplyVisa");

    // GET requests

    // Hello route
    app.get("/", (req, res) => {
      res.send("hello");
    });

    app.get("/all-artifacts", async (req, res) => {
      const allArtifacts = aftifactCollection.find();
      const result = await allArtifacts.toArray();
      res.json(result);
    });

    app.get("/view-artifact-details/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const artifactDetails = await aftifactCollection.findOne({
        _id: new ObjectId(id),
      });
      res.json(artifactDetails);
    });


    // app.get("/latestvisas", async (req, res) => {
    //   const latestvisas = usersCollection.find().limit(6);
    //   const result = await latestvisas.toArray();
    //   res.json(result);
    // });

    // app.get("/myvisas/:email", async (req, res) => {
    //   const email = req.params.email;
    //   const result = await applyVisaCollection.find({ email }).toArray();
    //   res.json(result);
    // });

    // app.get("/addedvisas/:email", async (req, res) => {
    //   const email = req.params.email;
    //   const result = await usersCollection.find({ email }).toArray();
    //   res.json(result);
    // });

    // // POST requests
    // app.post("/applyvisa", async (req, res) => {
    //   const applyVisa = req.body;
    //   const result = await applyVisaCollection.insertOne(applyVisa);
    //   res.send(result);
    // });

    app.post("/add-artifact", async (req, res) => {
      const NewArtifact = req.body;
      // console.log(NewArtifact);
      const result = await aftifactCollection.insertOne(NewArtifact);
      res.send(result);
    });

    // // DELETE requests
    // app.delete("/rmyapplication/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: new ObjectId(id) };
    //   const result = await applyVisaCollection.deleteOne(query);
    //   res.send(result);
    // });

    // app.delete("/addedvisadelete/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: new ObjectId(id) };
    //   const result = await usersCollection.deleteOne(query);
    //   res.send(result);
    // });

    // // PATCH request
    // app.patch("/updatevisa/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const data = req.body;
    //   const query = { _id: new ObjectId(id) };
    //   const update = {
    //     $set: {
    //       countryImage: data?.countryImage,
    //       countryName: data?.countryName,
    //       visaType: data?.visaType,
    //       processingTime: data?.processingTime,
    //       description: data?.description,
    //       ageRestriction: data?.ageRestriction,
    //       fee: data?.fee,
    //       validity: data?.validity,
    //       applicationMethod: data?.applicationMethod,
    //     },
    //   };
    //   const result = await usersCollection.updateOne(query, update);
    //   res.send(result);
    // });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
