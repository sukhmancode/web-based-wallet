import { useState } from 'react'

import './App.css'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Nmeonic from './components/nmeonic'
import Navbar from './components/Navbar'



function App() {
  

  return (
    <div className='px-5 py-2'>
      <Navbar />
       <Routes>
          <Route path='/' element={<Home/>}></Route>
          <Route path='/generate' element={<Nmeonic/>}></Route>
       </Routes>
    </div>
  )
}

export default App
