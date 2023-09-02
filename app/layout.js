import './styles/style.sass'
import Footer from './components/Footer'
import Header from './components/Header'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const metadata = {
	title: 'Removip - Home',
	description: 'Website da Removip'
}

export default function RootLayout({ children }) {
	return (
		<html lang="pt-br">
			<body>
				<header>
					<Header />
				</header>
				<main>
					{children}
				</main>
				<Footer />
				<ToastContainer
					position="bottom-right"
					autoClose={false}
					closeOnClick
				/>
			</body>
		</html>
	)
}