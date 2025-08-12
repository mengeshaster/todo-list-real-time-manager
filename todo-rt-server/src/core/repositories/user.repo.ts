import { User, IUser } from "../models/user.model";

const transformUser = (user: any): any => {
    if (!user) return user;

    if (Array.isArray(user)) {
        return user.map(transformUser);
    }

    const transformed = { ...user };
    if (transformed._id) {
        transformed.id = transformed._id.toString();
        delete transformed._id;
    }
    delete transformed.__v;
    delete transformed.passwordHash;
    return transformed;
};

export const UserRepo = {
    findById: async (id: string): Promise<IUser | null> => {
        const user = await User.findById(id).lean();
        return transformUser(user);
    },

    findByEmail: async (email: string): Promise<IUser | null> => {
        const user = await User.findOne({ email: email.toLowerCase() }).lean();
        return user;
    },

    create: async (userData: {
        email: string;
        name: string;
        passwordHash: string;
    }): Promise<IUser> => {
        const user = await User.create(userData);
        return transformUser(user.toObject());
    },

    update: async (id: string, updateData: Partial<IUser>): Promise<IUser | null> => {
        const user = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).lean();
        return transformUser(user);
    },

    delete: async (id: string): Promise<boolean> => {
        const result = await User.findByIdAndDelete(id);
        return !!result;
    },

    countUsers: async (): Promise<number> => {
        return User.countDocuments();
    },

    updateLastLogin: async (id: string): Promise<IUser | null> => {
        const user = await User.findByIdAndUpdate(
            id,
            { lastLogin: new Date() },
            { new: true }
        ).lean();
        return transformUser(user);
    }
};
