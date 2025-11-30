import { Router } from "express";
import { getprofile, updateprofile, deleteprofile } from "../../controller/admin/profile";
const router = Router();

router.get("/", getprofile);
router.put("/", updateprofile);
router.delete("/", deleteprofile);

export default router;