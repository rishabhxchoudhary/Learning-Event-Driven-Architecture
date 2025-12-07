import { authOptions } from "@/lib/auth";
import NextAuth, { NextAuthOptions } from "next-auth";

declare module "next-auth" {
    interface Session {
        userId?: string;
    }
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };