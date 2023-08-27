import './styles/style.sass'
import Footer from './components/Footer'
import Header from './components/Header'
export default function RootLayout({ children }) {
	return (
		<html lang="pt-br">
			<head>
				<link rel="icon" href="/favicon.ico" />
			</head>
			<body>
				<Header />
				{children}
				<Footer />
			</body>
		</html>
	)
}