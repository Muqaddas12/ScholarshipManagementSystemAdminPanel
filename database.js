
import { MongoClient,ServerApiVersion } from "mongodb";
const url='mongodb+srv://muqaddasmalik781:Muqaddas%40123@cluster0.z6qf6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'


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