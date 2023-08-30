import './styles/style.sass'
import Footer from './components/Footer'
import Header from './components/Header'
export default function RootLayout({ children }) {
	return (
		<html lang="pt-br">
			<head>
				<title>Removip</title>
			</head>
			<body>
				<header>
					<Header />
				</header>
				<main>
					{children}
				</main>
				<Footer />
			</body>
		</html>
	)
}