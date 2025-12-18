import mongoose from "mongoose";

export interface GroupDocument extends mongoose.Document {
    name: string;
    description: string;
    createdBy: mongoose.Schema.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const GroupSchema = new mongoose.Schema<GroupDocument>(
    {
        name: { type: String, required: true },
        description: { type: String },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
    },
    { timestamps: true }
);

export const GroupModel = mongoose.model<GroupDocument>(
    "Group",
    GroupSchema
);
