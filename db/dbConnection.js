import mongoose from "mongoose";

export const dbConnetion = async () => {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log("*******************************");
      console.log("MongoDb Connection on 🚀 ", process.env.PORT);
      console.log("*******************************");
    })
    .catch((error)=>{
        console.log("Failed to Connection", error);
    })
};
