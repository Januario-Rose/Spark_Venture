import React from 'react'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'

const Resources = () => {
  return (
    <div>
        <div className="flex min-h-screen bg-[#F0F7FF]">
            <Sidebar />
    
            <div className="flex-1 flex flex-col min-w-0">
            <Header />
    
            {/* Your main dashboard content goes here */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
                {/* Dashboard cards, charts, etc. */}
                <div className="text-gray-500 text-sm">
                Your resources content here...
                </div>
            </main>
            </div>
        </div>
    </div>
  )
}

export default Resources