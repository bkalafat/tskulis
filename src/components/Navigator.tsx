import Link from "next/link"
import { Categories } from "../utils/constant"
import Navbar from "react-bootstrap/Navbar";
import Image from "next/image"

const Navigator = () => {
  return (
    <div style={{ marginBottom: 8 }}>
      <Navbar style={{ paddingTop: 0, paddingBottom: 0, marginTop: 7 }} collapseOnSelect={true} bg="dark" variant="dark" expand="lg">
        <Link href="/"><Navbar.Brand style={{ paddingTop: 0, paddingBottom: 0, width: 57, height: 57 }}>

          <Image
            height="57"
            width="57"
            src={`/apple-icon-57x57.png`}
            alt="tskulis"
          />
        </Navbar.Brand></Link>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <ul className="navbar-nav ml-auto">
            {Object.values(Categories).map(c => (
              <li key={c.key} className="nav-item">
                <Link href="/[category]" as={"/" + c.to}><a className="nav-link" >{c.value}</a></Link>
              </li>
            ))}
            <li key="pp" className="nav-item">
              <Link href="/privacypolicy" as={"/privacypolicy"}><a className="nav-link" >Privacy Policy</a></Link>
            </li>
          </ul>
        </Navbar.Collapse>
      </Navbar>
    </div>
  )
}

export default Navigator