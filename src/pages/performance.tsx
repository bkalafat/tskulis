/**
 * Performance Dashboard Page
 * Admin-only access to performance monitoring dashboard
 */

import React from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import Layout from '../components/Layout';
import PerformanceDashboard from '../components/PerformanceDashboard';
import { getAdmins } from '../utils/helper';

const PerformancePage: React.FC = () => {
  return (
    <Layout>
      <Head>
        <title>Performans Paneli - TS Kulis</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <PerformanceDashboard />
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  
  // Check if user is admin
  if (!session?.user?.email || !getAdmins().includes(session.user.email)) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};

export default PerformancePage;