import mongoose from "mongoose";

const PlanSchema = new mongoose.Schema({
name :{ type: String, required: true, unique: true },
price_monthly:{ type: Number, },
price_annually :{ type: Number,  },
projects_limit:{ type: Number,  },
members_limit:{ type: Number,  },
}, { timestamps: true });


export const PlanModel = mongoose.model('Plan', PlanSchema);