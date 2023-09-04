import Atendimento from '../components/Atendimento'
import Banner from '../components/Banner'
import Aberto from '../components/Aberto'
import Formulario from '../components/Formulario'
import contato from '../styles/pages/contato/page.module.sass'
export default function Page() {
	return (
		<>
			<Banner img={'bg-ambulancias3'} alt={'Imagem banner de duas ambulâncias paradas.'} />
			<Atendimento className={contato.atendimento} />
			<Formulario />
			<Aberto className={contato.aberto} />
		</>
	)
}