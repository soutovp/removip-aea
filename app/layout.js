import './styles/style.sass'
import Footer from './components/Footer'
import Header from './components/Header'
import Head from 'next/head'
export default function RootLayout({ children }) {
	return (
		<html lang="pt-br">
			<Head>
				<title>Removip</title>
			</Head>
			<body>
				<Header />
				{children}
				<Footer />
			</body>
		</html>
	)
}