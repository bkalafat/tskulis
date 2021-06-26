import NextAuth from 'next-auth'
import { NextApiRequest, NextApiResponse } from 'next-auth/internals/utils'
import Providers from 'next-auth/providers'

const options = {
  site: process.env.NEXTAUTH_URL,
  debug: true,
  providers: [
    Providers.Twitter({
      clientId: process.env.TWITTER_CLIENT_KEY,
      clientSecret: process.env.TWITTER_CLIENT_SECRET
    })
  ],

  database: process.env.DATABASE_URL,

  callbacks: {
    /**
     * @param  {string} _url     URL provided as callback URL by the client
     * @param  {string} baseUrl  Default base URL of site (can be used as fallback)
     */
    redirect: async (_url: string, baseUrl: string) => {
      return Promise.resolve(baseUrl + "/adminpanel")
    }
  }
}

const auth = (req: NextApiRequest, res: NextApiResponse<any>) => NextAuth(req, res, options)
export default auth