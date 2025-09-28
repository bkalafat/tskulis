import React from 'react'
import Head from 'next/head'

const TestPage = () => {
  return (
    <>
      <Head>
        <title>Test Page - TS Kulis</title>
      </Head>
      <div style={{ padding: '20px' }}>
        <h1>Test Page</h1>
        <p>This is a test page to verify the frontend is working correctly.</p>
        <p>Backend API URL: {process.env.NEXT_PUBLIC_API_PATH}</p>
        <p>Current time: {new Date().toISOString()}</p>
      </div>
    </>
  )
}

export default TestPage