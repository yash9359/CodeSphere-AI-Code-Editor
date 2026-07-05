import NextAuth from "next-auth"
// import {PrismaAdapter} from "@auth/prisma-adapter"
import { db } from "./lib/db";
import authConfig from "./auth.config";
// import { getUserById } from "./modules/auth/actions";



export const { handlers, signIn, signOut, auth } = NextAuth({
  callbacks:{
    async signIn({user, account}){
      if(!user && !account) return false;
      const existingUser = await db.user.findUnique({
        where:{email:user.email!}
      })

      if(!existingUser) {
        const newUser = await db.user.create({
          data: {
            email: user.email!,
            name: user.name,
            image: user.image,

            accounts: {
              //@ts-ignore
              create: {
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refreshToken: account.refresh_token,
                accessToken: account.access_token,
                expiresAt: account.expires_at,
                tokenType: account.token_type,
                scope: account.scope,
                idToken: account.id_token,
                sessionState: account.session_state,
              }
            }
          }
        })
        if(!newUser) return false

        user.id = newUser.id;
      }
      else {
        const existingAccount = await db.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account?.providerAccountId
            }
          }
        })

        if(!existingAccount) {
          await db.account.create({
            data: {
              userId: existingUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              refreshToken: account.refresh_token,
              accessToken: account.access_token,
              expiresAt: account.expires_at,
              tokenType: account.token_type,
              scope: account.scope,
              idToken: account.id_token,
              //@ts-ignore
              sessionState: account.session_state,
            }
          })
        }
        user.id = existingUser.id;
      }
      return true;
    },
    async jwt({token}){
      //  Safety check
      if (!token || !token.email) return token;

      //  Fetch the user from YOUR database using their email
      const dbUser = await db.user.findUnique({
        where: { email: token.email }
      });

      // If user isn't in the DB yet, just return the token as-is
      if (!dbUser) return token;

      //  Override the default token data with your actual MongoDB data
      token.sub = dbUser.id;
      token.name = dbUser.name;
      token.email = dbUser.email;
      token.role = dbUser.role;

      return token;
    },
    async session({session, token}) {
      if (!token) return session;
      if(token.sub && session.user) {
        session.user.id = token.sub
      }

      if(token.sub && session.user) {
        session.user.role = token.role as any
      }
      return session;
    }
  },
  secret:process.env.AUTH_SECRET,
  // adapter:PrismaAdapter(db),
  session: { strategy: "jwt" },
  ...authConfig

});