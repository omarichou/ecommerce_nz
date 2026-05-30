// import NextAuth from "next-auth";
// import GithubProvider from "next-auth/providers/github";
// import CredentialsProvider from "next-auth/providers/credentials";
// import UserModal from "app/DBconfig/models/user";
// import { connectMongoDB } from "app/DBconfig/mongodb";
// import bcrypt from "bcrypt";
import { checkRateLimit, resetRateLimit } from "@/lib/rateLimit";


// export const authOptions = {
//   // Configure one or more authentication providers
//   providers: [
//     CredentialsProvider({
//       // The name to display on the sign in form (e.g. "Sign in with...")
//       name: "Credentials",

//       credentials: {},
//       async authorize(credentials, req , res ) {
        const email = String(credentials?.email || "").toLowerCase().trim();
        const rateLimit = checkRateLimit(req, email);
        if (!rateLimit.allowed) {
          throw new Error(`Trop de tentatives, réessayez dans ${Math.ceil(rateLimit.retryAfterMs / 1000)} secondes.`);
        }
//         // Add logic here to look up the user from the credentials supplied

//         // 2- connect to DB
//         await connectMongoDB();
//         // get user
      

//         // @ts-ignore
//         const user = await UserModal.findOne({ _id: process.env.NEXT_PUBLIC_admin_id });
// return user;
//   //        if (user) {
//   //            // الترتيب مهم جداً
//   //  // compare(credentials.password, user.password);
//   //         const match = await bcrypt.compare(credentials.password, user.password);
          
//   //         if (match &&(credentials.email === user.email)) {
//   //           return user;
//   //          }else {return null;}
      
//   //        } else {
//   //          return null;
//   //        }
//       },





//     }),
//   ],

//   secret : process.env.NEXTAUTH_SECRET ,

//   callbacks: {
//     async session({session}) {
//       // @ts-ignore
//       const mongodbUser = await UserModal.findOne({ email: session.user.email })
//       session.user.id = mongodbUser._id.toString()

//       session.user = {...session.user, ...mongodbUser._doc}

//       return session
//     }
//   } ,

//   pages: {
//     signIn: '/login',
//   }

// };
// const handler = NextAuth(authOptions);
// export { handler as GET, handler as POST };




import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import UserModal from "@/app/DBconfig/models/user";
import { connectMongoDB } from "@/app/DBconfig/mongodb";
import bcrypt from "bcrypt";


export const authOptions = {
  // Configure one or more authentication providers
  providers: [
    CredentialsProvider({
      // The name to display on the sign in form (e.g. "Sign in with...")
      name: "Credentials",

      credentials: {},
      async authorize(credentials, req , res ) {
        // Add logic here to look up the user from the credentials supplied

        // 2- connect to DB
        await connectMongoDB();

        // Récupérer les deux utilisateurs
        // @ts-ignore
        const admin = await UserModal.findOne({
          _id: process.env.NEXT_PUBLIC_admin_id,
        });

      

        // Essayer de connecter l'admin
        if (admin && credentials.email === admin.email) {
          const adminPasswordMatch = await bcrypt.compare(
            credentials.password,
            admin.password,
          );
          if (adminPasswordMatch) {
            return admin;
          }
        }

          // @ts-ignore
        // const user_dev = await UserModal.findOne({
        //   _id: process.env.NEXT_PUBLIC_developpeur_id,
        // });

        // // Essayer de connecter le développeur
        // if (user_dev && credentials.email === user_dev.email) {
        
        //     return user_dev;
          
        // }

        // Aucun utilisateur ne correspond
        return null;
      },





    }),
  ],

  secret : process.env.NEXTAUTH_SECRET ,

  callbacks: {
    async session({session}) {
      // @ts-ignore
      const mongodbUser = await UserModal.findOne({ email: session.user.email })
      session.user.id = mongodbUser._id.toString()

      session.user = {...session.user, ...mongodbUser._doc}

      return session
    }
  } ,

  pages: {
    signIn: '/login',
  }

};
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };



