import express from 'express';
import cookieParser from 'cookie-parser';
import cores from 'cors';

const app=express();

app.use(cores(
    {
        origin: process.env.CORS_ORIGIN,
        credentials: true
    }
))
app.use(express.json({limit: '50mb'}));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static("public"));  


export default app;