import './globals.css';

export const metadata = {
  title: 'Algebra Enterprises — Premium Real Estate Delhi',
  description: 'Find luxury rental and sale properties across Delhi\'s most prestigious neighbourhoods. Algebra Enterprises — your trusted real estate partner.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
