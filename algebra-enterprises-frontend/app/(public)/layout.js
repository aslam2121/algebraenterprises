import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'Algebra Enterprises — Premium Real Estate Delhi',
  description: 'Find luxury rental and sale properties across Delhi\'s most prestigious neighbourhoods. Algebra Enterprises — your trusted real estate partner.',
};

export default function RootLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
