import { auth } from "@/app/api/auth/[...nextauth]/option";
import dbConnect from "@/backend/lib/dbConnect";
import UserModel from "@/backend/model/User";
import mongoose from "mongoose";
import { User } from "next-auth";

export async function GET(request: Request) {
  await dbConnect();
  const session = await auth();
  const user: User = session?.user as User;

  if (!session || !user) {
    return Response.json(
      {
        success: false,
        message: "Not authorized",
      },
      {
        status: 401,
      }
    );
  }

  const userId = new mongoose.Types.ObjectId(user.id);

  try {
    const user = await UserModel.aggregate([
      {
        $match: {
          id: userId,
        },
      },
      {
        $unwind: "$messages",
      },
      {
        $sort: { "messages.createdAt": -1 },
      },
      {
        $group: {
          _id: "$_id",
          messages: { $push: "$messages" },
        },
      },
    ]);

    if (!user || user.length === 0) {
      return Response.json(
        {
          success: false,
          message: "User not found",
        },
        {
          status: 404,
        }
      );
    }

    return Response.json({
      success: true,
      messages: user[0].messages,
    });
  } catch (error) {
    console.log("Unable to get messages", error);
    return Response.json(
      {
        success: false,
        message: "Unable to get messages",
      },
      {
        status: 500,
      }
    );
  }
}
