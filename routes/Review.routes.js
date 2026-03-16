import express from 'express'
import { userAuthentication } from '../Middleware/User.middleware.js'
import { createReview, deleteReview, getProductReviews, updateReview } from '../Controller/Review.controller.js'

const router = express.Router()

router.post("/create", userAuthentication, createReview)
router.get("/:productId", userAuthentication, getProductReviews)
router.put("/update", userAuthentication, updateReview)
router.delete("/delete/:reviewId", userAuthentication, deleteReview)

export default router