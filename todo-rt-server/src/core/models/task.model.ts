import { Schema, model, Document, Types } from "mongoose";

interface ILock {
    isLocked: boolean;
    lockedBy?: Types.ObjectId;
    lockedAt?: Date;
}

interface ITask extends Document {
    title: string;
    description?: string;
    status: "open" | "done";
    priority: "low" | "med" | "high";
    dueDate?: Date;
    lock: ILock;
    createdBy: Types.ObjectId;
    updatedBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const LockSchema = new Schema<ILock>({
    isLocked: { type: Boolean, default: false },
    lockedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    lockedAt: { type: Date },
});

const TaskSchema = new Schema<ITask>(
    {
        title: { type: String, required: true, trim: true, maxlength: 200 },
        description: { type: String, trim: true, maxlength: 1000 },
        status: {
            type: String,
            enum: ["open", "done"],
            default: "open"
        },
        priority: {
            type: String,
            enum: ["low", "med", "high"],
            default: "med"
        },
        dueDate: { type: Date },
        lock: {
            type: LockSchema,
            default: () => ({ isLocked: false })
        },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    {
        timestamps: true,
        toJSON: {
            transform: function (doc: any, ret: any) {
                ret.id = ret._id;
                delete ret._id;
                delete ret.__v;
                return ret;
            }
        }
    }
);

TaskSchema.index({ status: 1 });
TaskSchema.index({ priority: 1 });
TaskSchema.index({ createdAt: -1 });
TaskSchema.index({ createdBy: 1 });
TaskSchema.index({ "lock.isLocked": 1, "lock.lockedBy": 1 });

export type TaskDoc = ITask;
export const Task = model<ITask>("Task", TaskSchema);
