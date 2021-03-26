import AdminPanel from "../../pages/adminpanel"
import { signIn, signOut, useSession } from 'next-auth/client'//MOCK'LA
import { getAdmins } from "../../utils/helper"

jest.mock('next-auth/client')

describe('AdminPanel',() => {

  let expectedSignIn, expectedEmail, expectedPassword

})