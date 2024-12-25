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
    const CommentArtifact = database.collection("Comments");

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
    
    app.get("/search-artifacts", async (req, res) => {
      const { name } = req.query;
    
      try {
        let query = {};
        if (name) {
          query = { artifactName: { $regex: name, $options: "i" } };
        }
    
        const filteredArtifacts = await aftifactCollection.find(query).toArray();
        res.json(filteredArtifacts);
      } catch (err) {
        res.status(500).json({ message: "Error fetching artifacts", error: err });
      }
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

    app.get("/featured-artifacts", async (req, res) => {
      const featuredArtifacts = aftifactCollection.find().limit(6);
      const result = await featuredArtifacts.toArray();
      res.json(result);
    });

    app.get("/comments/:artifactId", async (req, res) => {
      const artifactId = req.params.artifactId;

      try {
        const artifact = await CommentArtifact.findOne({ artifactId });

        if (!artifact) {
          return res.status(200).json({ artifactId, comments: [] });
        }

        // If artifact found, return the full artifact with comments
        return res.status(200).json(artifact);
      } catch (error) {
        console.error("Error fetching artifact:", error);
        return res.status(200).json({ artifactId, comments: [] });
      }
    });



    app.post("/comments/:id", async (req, res) => {
      const id = req.params.id;
      const newComment = req.body;

      try {
        // Check if the artifact exists
        const existingArtifact = await CommentArtifact.findOne({
          artifactId: id,
        });

        if (existingArtifact) {
          // If artifact exists, push the new comment to the existing comments array
          const result = await CommentArtifact.updateOne(
            { artifactId: id },
            {
              $push: { comments: newComment },
            }
          );

          return res.status(200).json({
            message: "Comment added successfully to the existing artifact",
          });
        } else {
          // If artifact doesn't exist, create a new artifact with the first comment
          const newArtifact = {
            artifactId: id,
            comments: [newComment],
          };
          const result = await CommentArtifact.insertOne(newArtifact);
          return res.status(201).json({
            message: "New artifact created with the first comment",
            result,
          });
        }
      } catch (error) {
        console.error("Error adding comment:", error);
        return res
          .status(500)
          .json({ message: "Internal Server Error", error });
      }
    });

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
      const update = {
        $inc: { react: data.isLiked ? 1 : -1 },
      };

      try {
        // Update the artifact's like count
        const result = await aftifactCollection.updateOne(query, update);

        // If the artifact was found and updated, proceed
        if (result.matchedCount > 0) {
          if (data.isLiked) {
            await likedArtifactsCollection.insertOne({
              artifactId: new ObjectId(id),
            });
            res.status(200).send({
              message: "Artifact liked and added to liked collection",
            });
          } else {
            await likedArtifactsCollection.deleteOne({
              artifactId: new ObjectId(id),
            });
            res.status(200).send({
              message: "Artifact unliked and removed from liked collection",
            });
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
