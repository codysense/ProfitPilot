// import express from 'express';
// import { createSalesMemo, getSalesMemos, createPurchaseMemo, getPurchaseMemos } from "../controllers/memos";

// // import memosController from '../controllers/memos';
// const router = express.Router();
// router.use('/', memosController as any);
// export default router;


import express from "express";
import {
  createSalesMemo,
  getSalesMemos,
  createPurchaseMemo,
  getPurchaseMemos,
} from "../controllers/memos";

const router = express.Router();

// Sales memos
router.post("/sales", createSalesMemo);
router.get("/sales", getSalesMemos);

// Purchase memos
router.post("/purchase", createPurchaseMemo);
router.get("/purchase", getPurchaseMemos);

export default router;

