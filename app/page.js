import style from './styles/style.sass'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './home'
export default function Page() {
	return (
		<>
			<Header />
			<Home />
			<Footer />
		</>
	)
}