import express from 'express'
import { userAuthentication } from '../Middleware/User.middleware.js'
import { createAddress, deleteAddress, getAddress, updateAddress } from '../Controller/Address.controller.js'

const router = express.Router()

router.post('/create', userAuthentication, createAddress)
router.put('/:id', userAuthentication, updateAddress)
router.get('/', userAuthentication, getAddress)
router.delete('/delete/:id', userAuthentication, deleteAddress)

export default router