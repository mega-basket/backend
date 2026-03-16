import express from 'express'
import { userAuthentication } from '../Middleware/User.middleware.js'
import {
  createOrder,
  createPaymentIntent,
  stripeWebhook,
  getOrderByPaymentIntent,
  getOrderById,
  getOrders,
  changeOrderStatus,
} from '../Controller/Order.controller.js'

const router = express.Router()

// Stripe webhook — NO auth middleware, Stripe verifies via signature
router.post('/webhook', stripeWebhook)

// Online payment flow
router.post('/create-payment-intent', userAuthentication, createPaymentIntent)
router.get('/payment/:paymentIntentId', userAuthentication, getOrderByPaymentIntent)

// COD order
router.post('/create', userAuthentication, createOrder)

// Order queries
router.get('/', userAuthentication, getOrders)
router.get('/:orderId', userAuthentication, getOrderById)

// Admin / status update
router.put('/:orderId/status', userAuthentication, changeOrderStatus)

export default router