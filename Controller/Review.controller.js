import Review from "../Model/Review.model.js";

export const createReview = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { productId, rating, comment } = req.body;

    if (!productId || !rating) {
      return res.status(400).json({
        success: false,
        message: "Rating is required",
      });
    }

    const review = await Review.create({
      userId,
      productId,
      rating,
      comment,
    });

    res.status(200).json({
      success: true,
      review,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "You have already reviewed this product",
      });
    }
  }
};

export const getProductReviews = async (req, res) => {
  const { productId } = req.params;

  const reviews = await Review.find({ productId })
    .populate("userId", "name")
    .sort({ createdAt: -1 });
  res.json(reviews);
};

export const updateReview = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { reviewId, rating, comment } = req.body;

    if (!reviewId) {
      return res.status(400).json({
        success: false,
        message: "Review ID is required",
      });
    }
    const review = await Review.findOneAndUpdate(
      { _id: reviewId, userId },
      { rating, comment },
      { new: true, runValidators: true },
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found or not authorized",
      });
    }

    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      review,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update review",
      error: error.message,
    });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { reviewId } = req.params;

    if (!reviewId) {
      return res.status(400).json({
        success: false,
        message: "Review not found and not authorized",
      });
    }

    const review = await Review.findOneAndDelete({ userId, _id: reviewId });

    if (!review) {
      return res.status(400).json({
        success: false,
        message: "Review is not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update review",
      error: error.message,
    });
  }
};
