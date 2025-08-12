import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
    _id: string;
    email: string;
    name: string;
    passwordHash: string;
    createdAt: Date;
    lastLogin?: Date;
}

const UserSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            maxlength: 255
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },
        passwordHash: {
            type: String,
            required: true
        },
        lastLogin: {
            type: Date
        }
    },
    {
        timestamps: true,
        toJSON: {
            transform: function (doc: any, ret: any) {
                ret.id = ret._id;
                delete ret._id;
                delete ret.__v;
                delete ret.passwordHash;
                return ret;
            }
        }
    }
);

UserSchema.index({ email: 1 });

export const User = model<IUser>("User", UserSchema);
