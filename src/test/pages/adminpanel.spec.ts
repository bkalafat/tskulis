import AdminPanel from "../../pages/adminpanel"
import { signIn, signOut, useSession } from 'next-auth/react'//MOCK'LA
import { getAdmins } from "../../utils/helper"

jest.mock('next-auth/react')

describe('AdminPanel',() => {

  let expectedSignIn, expectedEmail, expectedPassword

})