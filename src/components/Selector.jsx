import React from 'react'
import { useNavigate } from 'react-router-dom'
const Selector = () => {
  const navigate = useNavigate()
  return (
    <div className='flex flex-col gap-4 mt-12 px-10'>
        <h1 className='text-5xl font-black'>Web Wallet support multiple blockchains</h1>
        <p className='font-black-500 text-3xl'>Choose a blockchain to get started.</p>
        <div className='flex gap-5' onClick={() => navigate('/generate')}>
            <button className='bg-black-700 text-white px-5 py-2 text-1xl rounded-md hover:text-black-700 hover:bg-white hover:border-slate-700 border transition duration-300 ease-in-out'>
            Solana
            </button>

            <button className='bg-black-700 text-white px-5 py-2 text-1xl rounded-md hover:text-black-700 hover:bg-white hover:border-slate-700 border transition duration-300 ease-in-out'>
            Etherum
            </button>
        </div>
    </div>
  )
}

export default Selector