import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import UserModal from "@/app/DBconfig/models/user";
import { connectMongoDB } from "@/app/DBconfig/mongodb";
import bcrypt from "bcrypt";

const resolveRole = (user) => {
  const adminId = process.env.NEXT_PUBLIC_admin_id || process.env.ADMIN_ID || "";
  if (adminId && user?._id?.toString() === adminId) return "admin";
  return user?.role || "user";
};

const providers = [
  CredentialsProvider({
      name: "Credentials",
      credentials: {},
      async authorize(credentials) {
        const email = credentials?.email?.toString().trim();
        const password = credentials?.password?.toString();

        if (!email || !password) {
          return null;
        }

        await connectMongoDB();
        const user = await UserModal.findOne({ email }).lean();
        if (!user) return null;

        const passwordMatch = await bcrypt.compare(password, user.password || "");
        if (!passwordMatch) return null;

        const name = user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim();
        return {
          id: user._id?.toString(),
          email: user.email,
          name: name || user.email,
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          phoneNumber: user.phoneNumber || "",
          role: resolveRole(user),
        };
      },
    }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.unshift(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const authOptions = {
  providers,
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.firstName = user.firstName || "";
        token.lastName = user.lastName || "";
        token.phoneNumber = user.phoneNumber || "";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.firstName = token.firstName || "";
        session.user.lastName = token.lastName || "";
        session.user.phoneNumber = token.phoneNumber || "";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
