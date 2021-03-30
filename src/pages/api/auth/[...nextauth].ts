import NextAuth from 'next-auth'
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
     * @param  {string} _url      URL provided as callback URL by the client
     * @param  {string} baseUrl  Default base URL of site (can be used as fallback)
     * @return {string}          URL the client will be redirect to
     */
    redirect: async (_url, baseUrl) => {
      return Promise.resolve(baseUrl + "/adminpanel")
    }
  }
}

export default (req, res) => NextAuth(req, res, options)