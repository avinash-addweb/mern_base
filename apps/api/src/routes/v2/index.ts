import { Router } from "express";
import v1Routes from "../v1/index.js";

const router = Router();

// V2 reuses all V1 routes by default
// Override specific routes below as needed:
//
// import myNewHandler from "../../modules/example/example.controller.js";
// router.get("/example", myNewHandler);
//
// Then fall through to V1 for everything else:
router.use(v1Routes);

export default router;
