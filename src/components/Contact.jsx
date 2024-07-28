import { CONTACT } from "../constants"



const Contact = () => {
  return (
    <div className='pb-20 border-b border-neutral-900'>
      <h1 className='my-10 text-4xl text-center'>Get In Touch</h1>
      <div className='tracking-tighter text-center'>
        <p className='my-4'>{CONTACT.address}</p>
        <p className='my-4'>{CONTACT.phoneNo}</p>
        <a href={`mailto:${CONTACT.email}`} className='border-b'>
          {CONTACT.email}
        </a>
      </div>
    </div>
  )
}

export default Contact;