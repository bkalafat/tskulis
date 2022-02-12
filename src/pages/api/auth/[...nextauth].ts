import NextAuth, { NextAuthOptions } from 'next-auth'
import TwitterProvider from 'next-auth/providers/twitter'
import { MongoDBAdapter } from "@next-auth/mongodb-adapter"
import clientPromise from '../../../../lib/mongodb'
import { NextApiRequest, NextApiResponse } from 'next'

const options : NextAuthOptions = {
  debug: true,
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET
    }),

  ],

  secret: process.env.SECRET,

  adapter: MongoDBAdapter(clientPromise),

  callbacks: {
    redirect: async  ({baseUrl} ) => {
      return Promise.resolve(baseUrl + "/adminpanel")
    }
  }
}

const auth = (req: NextApiRequest, res: NextApiResponse<any>) => NextAuth(req, res, options)
export default auth