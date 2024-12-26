# Historical Artifacts Tracker

## 🎯 Key Features

- **Artifact Management**:
  - Add, update, and delete artifacts (logged-in users).
  - Like/unlike artifacts with database synchronization.
  - View personal artifacts and liked artifacts separately.

### Server-Side Installation

1. Clone the repository:
   ```bash
   git clone <server-repo-url>
   ```
2. Navigate to the server directory:
   ```bash
   cd server
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Configure `.env` for MongoDB and JWT:
   ```env
   MONGODB_URI=<your-mongodb-uri>
   JWT_SECRET=<your-jwt-secret>
   ```
5. Start the server:
   ```bash
   npm start
   ```

---

## 📜 License

This project is licensed under the MIT License.
