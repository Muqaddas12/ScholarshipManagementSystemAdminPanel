import dotenv from 'dotenv'
import { MongoClient,ServerApiVersion } from "mongodb";
dotenv.config()
const url=process.env.MONGODBURI


const mongoose= new MongoClient(url,{  
    serverApi:{
        version:ServerApiVersion.v1,
        strict:true,
        deprecationErrors:true,
    }
})
let db;
export const connect = async () => {
  try {
    await mongoose.connect();
    db = mongoose.db('NodalAdmin');
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
  }
};

export const disconnect = async () => {
  try {
    await mongoose.close();
    console.log('Disconnected successfully');
  } catch (error) {
    console.error('Error disconnecting from database:', error);
  }
};

export const getDb = () => db;