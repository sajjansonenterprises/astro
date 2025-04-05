import Head from 'next/head';
import MahaDashaCalculator from './components/MahaDashaCalculator';


export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Maha Dasha Calculator</title>
        <meta name="description" content="Calculate your Vedic astrology Maha Dasha periods" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <MahaDashaCalculator />
      </main>

      <footer className="mt-12 text-center text-sm text-gray-500">
        <p>Vedic Astrology Maha Dasha Calculator</p>
      </footer>
    </div>
  );
}