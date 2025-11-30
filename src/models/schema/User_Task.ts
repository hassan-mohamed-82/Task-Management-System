import mongoose, { Schema, Document, Types } from "mongoose";
import {  TaskStatus } from "./Tasks";
import { IUser } from "./auth/User";

export interface IUserTask extends Document {
  user_id: mongoose.Types.ObjectId;
  task_id: mongoose.Types.ObjectId;
  status?:'pending' | 'in_progress' | 'done' | 'Approved from Member_can_approve' | 'rejected from Member_can_rejected' | 'Pending_edit' | 'in_progress_edit' ;
  rejection_reasonId:mongoose.Types.ObjectId;
User_taskId: mongoose.Types.ObjectId[];
  is_finished?: boolean;
  role: 'member' | 'membercanapprove';  
}

const UserTaskSchema = new Schema<IUserTask>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    task_id: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    status: {
      type: String,
     enum: ['pending', 'in_progress', 'done', 'pending_edit',"in_progress_edit", 'Approved from Member_can_approve', 'rejected from Member_can_rejected'],
      required: true,
    },
    is_finished: {
      type: Boolean,
      default: false,
    },
    rejection_reasonId: {
      type: Schema.Types.ObjectId, // سبب الرفض لو الحالة rejected
      ref: "RejectedReson",
    },
    role:{
      type: String,
      enum: [ 'member', 'membercanapprove'],
      default: 'member',
    },
        User_taskId:[{
      type: Schema.Types.ObjectId,
      ref: "User_Task",
    }]

   
  },
  { timestamps: true }
);

export const UserTaskModel = mongoose.model<IUserTask>("User_Task", UserTaskSchema);
