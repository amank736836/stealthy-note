import "next-auth";
import { DefaultSession } from "next-auth";
import { Inter_Tight } from "next/font/google";

declare module "next-auth" {
  interface User {
    _id: string;
    isVerified: boolean;
    isAcceptingMessages: boolean;
    username: string;
  }
  interface Session {
    user: {
      _id: string;
      isVerified: boolean;
      isAcceptingMessages: boolean;
      username: string;
    } & DefaultSession["user"];
  }
  interface token {
    _id: string;
    isVerified: boolean;
    isAcceptingMessages: boolean;
    username: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    _id?: string;
    isVerified?: boolean;
    isAcceptingMessages?: boolean;
    username?: string;
  }
}
