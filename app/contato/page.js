import style from '../styles/style.sass'
import Header from '../components/Header'
import Atendimento from '../components/Atendimento'
import Banner from '../components/Banner'
import Aberto from '../components/Aberto'
import Footer from '../components/Footer'
import Formulario from '../components/Formulario'

export default function Page() {
	return (
		<>
			<Header />
			<Banner page={'contato'} />
			<Atendimento />
			<souto>SUA TRANQUILIDADE EM BOAS MÃOS</souto> {/*Sugiro criar um png com fundo transparente com o texto e imagem dessa parte */}
			{/* formulário */}
			<Formulario />
			<Aberto />
			<Footer />
		</>
	)
}