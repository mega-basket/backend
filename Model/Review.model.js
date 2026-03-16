import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        trim: true,
        maxLength: 500
    }

}, { timestamps: true });

reviewSchema.index(
    {userId: 1, productId: 1},
    {unique: true}
)

reviewSchema.post('save', async function () {
    const Review = mongoose.model("Review")
    const Product = mongoose.model("Product")

    const stats = await Review.aggregate([
        {$match: {productId: this.productId}},
        {
            $group: {
                _id: "$productId",
                avgRating: {$avg: "$rating"},
                totalReviews: {$sum: 1}
            }
        }
    ])

    if (stats.length) {
        await Product.findByIdAndUpdate(this.productId, {
            avgRating: Number(stats[0].avgRating.toFixed(1)),
            totalReviews: stats[0].totalReviews
        })
    }
})

reviewSchema.post('findOneAndDelete', async function(doc){
    if (!doc) {
        return
    }

    const Product = mongoose.model("Product")

    await Product.findOneAndUpdate(doc.productId, {
        avgRating: 0,
        totalReviews: 0
    })

})


const Review = mongoose.model("Review", reviewSchema)

export default Review