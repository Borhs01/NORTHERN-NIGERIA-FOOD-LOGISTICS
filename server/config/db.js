const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGO_CLUSTER || process.env.MONGO_cluster;
  if (!mongoUri) {
    throw new Error('MONGO_URI is not defined. Set MONGO_URI in your .env file (or MONGO_CLUSTER/MONGO_cluster).');
  }

  const conn = await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  console.log(`MongoDB Connected: ${conn.connection.host}`);
};

module.exports = connectDB;
