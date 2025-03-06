import express from "express";
import { config } from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connection } from "./mongoDB/connection.js";
import { errorMiddleware } from "./middlewares/error.js";
// import { jobNotification } from "./features/jobNotification.js";
import fileUpload from "express-fileupload";
import userRouter from "./routers/userRouter.js";
import jobRouter from "./routers/jobRouter.js";
import applicationRouter from "./routers/applicationRouter.js";


const app = express();
config({ path: "./config/config.env" });

app.get("/",(req,res)=>{
  res.send("Server is running.")
})

app.use(
  cors({
    origin: [process.env.FRONTEND_URL],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

app.use("/api/user", userRouter);
app.use("/api/job", jobRouter);
app.use("/api/application", applicationRouter);

// jobNotification();
connection();
app.use(errorMiddleware);

export default app;
