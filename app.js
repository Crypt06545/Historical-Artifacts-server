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
    const likedArtifactsCollection = database.collection("LikedArtifact");

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

    app.get("/my-add-artifact/:email", async (req, res) => {
      const email = req.params.email;
      // console.log("Fetching artifacts for email:", email);
      try {
        const result = await aftifactCollection
          .find({ userInfo: email })
          .toArray();
        if (result.length > 0) {
          res.json(result);
        } else {
          res
            .status(404)
            .json({ message: "No artifacts found for this email" });
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        res.status(500).json({ message: "Server error" });
      }
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

    // DELETE requests
    app.delete("/rm-my-artifact/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await aftifactCollection.deleteOne(query);
      res.send(result);
    });

    // app.delete("/addedvisadelete/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: new ObjectId(id) };
    //   const result = await usersCollection.deleteOne(query);
    //   res.send(result);
    // });

    // PATCH request
    app.patch("/update-artifact/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      // console.log({ id, data });
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: {
          artifactName: data?.artifactName,
          artifactImage: data?.artifactImage,
          artifactType: data?.artifactType,
          historicalContext: data?.historicalContext,
          createdAt: data?.createdAt,
          discoveredAt: data?.discoveredAt,
          discoveredBy: data?.discoveredBy,
          presentLocation: data?.presentLocation,
        },
      };
      const result = await aftifactCollection.updateOne(query, update);
      res.send(result);
    });

    app.patch("/update-artifact-like/:id", async (req, res) => {
  const id = req.params.id;
  const data = req.body;

  // Find the artifact in the collection
  const query = { _id: new ObjectId(id) };

  // Determine whether to increment or decrement the like count
  const update = {
    $inc: { react: data.isLiked ? 1 : -1 }, // Increment or decrement based on isLiked value
  };

  try {
    // Update the artifact's like count
    const result = await aftifactCollection.updateOne(query, update);

    // If the artifact was found and updated, proceed
    if (result.matchedCount > 0) {
      if (data.isLiked) {
        // If the user liked the artifact, add it to likedArtifactsCollection
        await likedArtifactsCollection.insertOne({
          artifactId: new ObjectId(id),
        });
        res.status(200).send({ message: "Artifact liked and added to liked collection" });
      } else {
        // If the user unliked the artifact, remove it from likedArtifactsCollection
        await likedArtifactsCollection.deleteOne({
          artifactId: new ObjectId(id),
        });
        res.status(200).send({ message: "Artifact unliked and removed from liked collection" });
      }
    } else {
      res.status(404).send({ message: "Artifact not found" });
    }
  } catch (error) {
    res.status(500).send({ message: "Failed to update like count", error });
  }
});




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
