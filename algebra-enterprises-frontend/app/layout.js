import './globals.css';
import Script from 'next/script';

const themeInitScript = `
  (function() {
    try {
      var storedTheme = localStorage.getItem('ae-public-theme');
      var theme = storedTheme === 'light' ? 'light' : 'dark';
      document.documentElement.dataset.theme = theme;
    } catch (error) {
      document.documentElement.dataset.theme = 'dark';
    }
  })();
`;

export const metadata = {
  title: 'Algebra Enterprises — Premium Real Estate Delhi',
  description: 'Find luxury rental and sale properties across Delhi\'s most prestigious neighbourhoods. Algebra Enterprises — your trusted real estate partner.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Script id="ae-theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        {children}
      </body>
    </html>
  );
}
