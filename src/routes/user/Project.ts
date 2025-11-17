import { Router } from "express";
import {getallProject,getProjectDetailsForUser} from '../../controller/user/project'
import { catchAsync } from "../../utils/catchAsync";
const route = Router();
route.get("/:project_id", catchAsync(getProjectDetailsForUser));
route.get("/", catchAsync(getallProject));
export default route;