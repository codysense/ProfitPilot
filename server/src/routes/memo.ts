import { Router } from "express";
import { MemoController } from "../controllers/memo";
import { authenticate, requireRole } from "../middleware/auth";
import { auditLogger } from "../middleware/audit";

const router = Router();
const memoController = new MemoController();

// memo.routes.ts
router.post(
  "/",
  authenticate,
  requireRole(["Accountant"]),
  auditLogger("CREATE", "MEMO"),
  (req, res) => memoController.createMemo(req, res),
);

router.get(
  "/",
  authenticate,
  requireRole(["Accountant"]),
  auditLogger("READ", "MEMO"),
  (req, res) => memoController.getMemos(req, res),
);

// router.get('/:id', authenticate, requireRole(['Accountant']), auditLogger('READ', 'MEMO'), (req, res) => memoController.getMemo(req, res));

router.patch(
  "/:id",
  authenticate,
  requireRole(["Accountant"]),
  auditLogger("UPDATE", "MEMO"),
  (req, res) => memoController.updateMemo(req, res),
);

router.post(
  "/:id/post",
  authenticate,
  requireRole(["Accountant"]),
  auditLogger("POST", "MEMO"),
  (req, res) => memoController.postMemo(req, res),
);

router.delete(
  "/:id",
  authenticate,
  requireRole(["Accountant"]),
  auditLogger("DELETE", "MEMO"),
  (req, res) => memoController.deleteMemo(req, res),
);

// router.post(
//   '/memos',
//   authenticate,
//   requireRole(['Accountant']),
//   auditLogger('CREATE', 'MEMO'),
//   (req, res) => memoController.createMemo(req, res)
// );

// // import { Router } from 'express';
// // import { MemoController } from '../controllers/memo';
// // import { authenticate, requireRole } from '../middleware/auth';
// // import { auditLogger } from '../middleware/audit';

// // const router = Router();
// // const memoController = new MemoController();

// router.get(
//   '/memos',
//   authenticate,
//   requireRole(['Accountant']),
//   auditLogger('READ', 'MEMO'),
//   (req, res) => memoController.listMemos(req, res)
// );

// router.get(
//   '/memos/:id',
//   authenticate,
//   requireRole(['Accountant']),
//   auditLogger('READ', 'MEMO'),
//   (req, res) => memoController.getMemo(req, res)
// );

// router.patch(
//   '/memos/:id',
//   authenticate,
//   requireRole(['Accountant']),
//   auditLogger('UPDATE', 'MEMO'),
//   (req, res) => memoController.updateMemo(req, res)
// );

// router.post(
//   '/memos/:id/post',
//   authenticate,
//   requireRole(['Accountant']),
//   auditLogger('POST', 'MEMO'),
//   (req, res) => memoController.postMemo(req, res)
// );

// router.delete(
//   '/memos/:id',
//   authenticate,
//   requireRole(['Accountant']),
//   auditLogger('DELETE', 'MEMO'),
//   (req, res) => memoController.deleteMemo(req, res)
// );

export default router;
