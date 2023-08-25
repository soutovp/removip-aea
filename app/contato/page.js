import Atendimento from '../components/Atendimento'
import Banner from '../components/Banner'
import Aberto from '../components/Aberto'
import Formulario from './formulario'

export default function Page() {
	return (
		<>
			<Banner page={'contato'} />
			<Atendimento />
			<souto>SUA TRANQUILIDADE EM BOAS MÃOS</souto> {/*Sugiro criar um png com fundo transparente com o texto e imagem dessa parte */}
			{/* formulário */}
			<Formulario />
			<Aberto />
		</>
	)
}