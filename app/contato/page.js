import Atendimento from '../components/Atendimento'
import Banner from '../components/Banner'
import Aberto from '../components/Aberto'
import Formulario from '../components/Formulario'
import Souto from '../components/Souto'

export default function Page() {
	return (
		<>
			<Banner page={'contato'} />
			<Atendimento />
			<Souto>SUA TRANQUILIDADE EM BOAS MÃOS</Souto> {/*Sugiro criar um png com fundo transparente com o texto e imagem dessa parte */}
			{/* formulário */}
			<Formulario />
			<Aberto />
		</>
	)
}