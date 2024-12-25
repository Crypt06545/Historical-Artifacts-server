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
    const CommentArtifact = database.collection("Comments");
    const LikedArtifact = database.collection("LikedArtifact");

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

        const filteredArtifacts = await aftifactCollection
          .find(query)
          .toArray();
        res.json(filteredArtifacts);
      } catch (err) {
        res
          .status(500)
          .json({ message: "Error fetching artifacts", error: err });
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

    app.get("/liked-artifacts/:email", async (req, res) => {
      const userEmail = req.params.email;

      try {
        // Query the LikedArtifact collection to find matching documents by userEmail
        const result = await LikedArtifact.find({ userEmail }).toArray();

        if (result.length > 0) {
          // Send the artifactId of the matched documents
          const artifactIds = result.map((item) => item.artifactId);
          // res.json({ artifactIds });
          res.send({artifactIds});
        } else {
          res
            .status(404)
            .json({ message: "No liked artifacts found for this email" });
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        res.status(500).json({ message: "Server error" });
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
      const { id } = req.params;
      const { userEmail, liked } = req.body;

      try {
        if (!ObjectId.isValid(id)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid ID" });
        }

        const artifact = await aftifactCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!artifact) {
          return res
            .status(404)
            .json({ success: false, message: "Artifact not found" });
        }

        // Ensure `liked_By` is an array and `react` is a non-negative number
        if (!Array.isArray(artifact.liked_By)) {
          artifact.liked_By = [];
        }
        if (typeof artifact.react !== "number" || artifact.react < 0) {
          artifact.react = 0;
        }

        const userIndex = artifact.liked_By.findIndex(
          (user) => user.email === userEmail
        );

        // Case when the user likes the artifact
        if (liked) {
          if (userIndex === -1) {
            artifact.liked_By.push({ email: userEmail, id });
            artifact.react += 1; // Increment react count

            await database.collection("LikedArtifact").insertOne({
              artifactId: id,
              userEmail: userEmail,
            });
          } else {
            artifact.liked_By[userIndex].isLiked = true;
            artifact.react += 1;
            const existingLike = await database
              .collection("LikedArtifact")
              .findOne({
                artifactId: id,
                userEmail: userEmail,
              });

            if (!existingLike) {
              await database.collection("LikedArtifact").insertOne({
                artifactId: id,
                userEmail: userEmail,
              });
            }
          }
        } else {
          // Case when the user dislikes the artifact
          if (userIndex !== -1) {
            // User is removing their like
            artifact.liked_By[userIndex].isLiked = false;
            artifact.react -= 1;

            // Remove from the 'LikedArtifact' collection
            await database.collection("LikedArtifact").deleteOne({
              artifactId: id,
              userEmail: userEmail,
            });
          }
        }

        await aftifactCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { liked_By: artifact.liked_By, react: artifact.react } }
        );

        res.status(200).json({
          success: true,
          message: `Artifact ${liked ? "liked" : "disliked"} successfully`,
          react: artifact.react,
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
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
