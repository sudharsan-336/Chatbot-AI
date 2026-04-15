import express from 'express';
import { getPlan, purchasePlan } from '../controller/creditController.js';
import { protect } from '../middlewares/auth.js';

const creditRouter = express.Router(); 

creditRouter.get('/plans', getPlan);
creditRouter.post('/purchase', protect, purchasePlan);

export default creditRouter;