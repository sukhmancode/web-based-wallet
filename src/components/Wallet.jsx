import React from 'react';

const Wallet = ({ walletInfo }) => {
  return (
    <div className='w-full'>
      <ul>
        {walletInfo.map((info, idx) => (
          <li 
            key={idx} 
            className='flex flex-col p-4 rounded-lg m-4' 
            style={{ 
              backgroundColor: idx % 2 === 0 ? '#f0f4f8' : '#e1e7ec' 
            }} // Different background colors based on index
          >
            <div className='mt-10'>
              <span className='text-3xl font-bold'>Wallet No: {info.walletNo}</span>
            </div>
            <div className='flex gap-3 items-center'>
              <h2 className='text-2xl font-semibold'>Public Key</h2>
              <span className='font-medium'>{info.walletPublicKey}</span>
            </div>
            <div className='flex gap-3 items-center'>
              <h2 className='text-2xl font-semibold'>Balance</h2>
              <span className='font-medium'>{info.balance} SOL</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Wallet;
