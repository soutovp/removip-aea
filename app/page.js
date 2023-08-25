import style from './styles/style.sass'
import Footer from './components/Footer'
import Home from './home'
import Header from './components/Header'
export default function Page() {
	return (
		<>
			<Header />
			<Home />
			<Footer />
		</>
	)
}