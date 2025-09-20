import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    street:{
        type:String,
    },
    city:{
    type:String,
    },
    state:{
    type:String,
    },
    country:{
    type:String,
    },
    postalCode:{
    type:String,
    },
})

export const Address = mongoose.model("Address", addressSchema) 