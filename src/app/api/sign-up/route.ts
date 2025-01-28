import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  await dbConnect();
  try {
    const { email, username, password } = await request.json();

    if (!email) {
      return Response.json(
        {
          success: false,
          message: "Email is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!username) {
      return Response.json(
        {
          success: false,
          message: "Username is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!password) {
      return Response.json(
        {
          success: false,
          message: "Password is required",
        },
        {
          status: 400,
        }
      );
    }

    const existingUserVerifiedByUsername = await UserModel.findOne({
      username,
      isVerified: true,
    });

    if (existingUserVerifiedByUsername) {
      return Response.json(
        {
          success: false,
          message: "Username already exists",
        },
        {
          status: 400,
        }
      );
    }

    const existingUserByEmail = await UserModel.findOne({
      email,
    });

    if (existingUserByEmail) {
      if (existingUserByEmail.isVerified) {
        return Response.json(
          {
            success: false,
            message: "User already exists with this email",
          },
          {
            status: 400,
          }
        );
      } else {
        const verifyCode = Math.floor(
          100000 + Math.random() * 900000
        ).toString();

        const hashedPassword = await bcrypt.hash(password, 10);

        const verifyCodeExpiry = new Date();

        verifyCodeExpiry.setHours(verifyCodeExpiry.getHours() + 1);

        await UserModel.findByIdAndUpdate(existingUserByEmail._id, {
          username,
          password: hashedPassword,
          verifyCode,
          verifyCodeExpiry,
        });

        //send verification email
        const emailResponse = await sendVerificationEmail(
          email,
          username,
          verifyCode
        );

        if (!emailResponse.success) {
          return Response.json(
            {
              success: false,
              message: `Failed to send verification email: ${emailResponse.message}`,
            },
            {
              status: 500,
            }
          );
        }

        return Response.json(
          {
            success: true,
            message: "User registered successfully. Please verify your email",
          },
          {
            status: 201,
          }
        );
      }
    } else {
      const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

      const hashedPassword = await bcrypt.hash(password, 10);

      const verifyCodeExpiry = new Date();

      verifyCodeExpiry.setHours(verifyCodeExpiry.getHours() + 1);

      const newUser = await UserModel.create({
        username,
        email,
        password: hashedPassword,
        verifyCode,
        verifyCodeExpiry,
        messages: [],
      });

      //send verification email
      const emailResponse = await sendVerificationEmail(
        email,
        username,
        verifyCode
      );

      if (!emailResponse.success) {
        return Response.json(
          {
            success: false,
            message: `Failed to send verification email: ${emailResponse.message}`,
          },
          {
            status: 500,
          }
        );
      }

      return Response.json(
        {
          success: true,
          message: "User registered successfully. Please verify your email",
        },
        {
          status: 201,
        }
      );
    }
  } catch (error) {
    console.error("Error in POST /api/sign-up", error);
    return Response.json(
      {
        success: false,
        message: "Error Registering User",
      },
      {
        status: 500,
      }
    );
  }
}
