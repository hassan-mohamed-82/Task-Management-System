import mongoose, { Schema, Document } from "mongoose";
import {  TaskStatus } from "./Tasks";

export interface IUserTask extends Document {
  user_id: mongoose.Types.ObjectId;
  task_id: mongoose.Types.ObjectId;
  status?:'pending' | 'in_progress' | 'done' | 'Approved' | 'rejected';
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
      enum: ['pending', 'in_progress', 'done', 'Approved', 'rejected'],
      required: true,
    },
   
  },
  { timestamps: true }
);

export const UserTaskModel = mongoose.model<IUserTask>("User_Task", UserTaskSchema);
