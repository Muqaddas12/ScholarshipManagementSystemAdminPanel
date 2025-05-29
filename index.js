import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import route from './routes/index.js';
import authRoute from './routes/Authentication.js';
import cookieParser from 'cookie-parser';
import adminRoute from './routes/adminRoute.mjs';
import cors from 'cors';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = express();
server.use(cors());
server.use(express.urlencoded({ extended: true }));
server.use(express.json());
server.use(cookieParser());

// Serve static files from the 'uploads' directory
server.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Set view engine and views folder path
server.set('view engine', 'ejs');
server.set('views', path.join(__dirname, 'views'));

// Use routes
server.use('/', route);
server.use('/login', authRoute);
server.use('/admin', adminRoute);


// server.listen(3000,()=>{
//     console.log('server is running')
// })
export default server