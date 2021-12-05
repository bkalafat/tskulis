import { NextApiRequest, NextApiResponse } from 'next'
import NextAuth, { NextAuthOptions } from 'next-auth'
import TwitterProvider from 'next-auth/providers/twitter'
import { MongoDBAdapter } from "@next-auth/mongodb-adapter"
import clientPromise from "../../../../lib/mongodb"

const options: NextAuthOptions = {
  debug: true,
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_KEY,
      clientSecret: process.env.TWITTER_CLIENT_SECRET
    })
  ],
  adapter: MongoDBAdapter(clientPromise),

  callbacks: {
    /**
     * @param  {string} _url     URL provided as callback URL by the client
     * @param  {string} baseUrl  Default base URL of site (can be used as fallback)
     */
    redirect: async (params: { url: string, baseUrl: string }) => {
      return Promise.resolve(params.baseUrl + "/adminpanel")
    }
  }
}

const auth = (req: NextApiRequest, res: NextApiResponse<any>) => NextAuth(req, res, options)
export default auth