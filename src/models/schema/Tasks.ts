import { Schema, model, Document, Types } from 'mongoose';
import { IUser } from './auth/User';
import { IProject } from './project';

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';

export interface ITask extends Document {
  title: string;
  description?: string;
  project: Types.ObjectId | IProject;
  assignedTo: Types.ObjectId[] | IUser[];
  createdBy: Types.ObjectId | IUser;
  priority?: string 
  status: TaskStatus;
  dueDate?: Date;
  attachments: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true },
    description: { type: String },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    assignedTo: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    priority: { type:String, enum: ['low', 'medium', 'high'] },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'done', 'blocked'],
      default: 'todo',
    },
    dueDate: { type: Date },
    attachments: [{ type: Schema.Types.ObjectId, ref: 'Attachment' }],
  },
  { timestamps: true }
);

export const TaskModel = model<ITask>('Task', taskSchema);
