import Banner from '../components/Banner'
import Atendimento from '../components/Atendimento'
import Aberto from '../components/Aberto'
import Souto from '../components/Souto'

export default function Home() {
	return (
		<main>
			<Banner page={'home'} />
			<Souto>SUA TRANQUILIDADE EM BOAS MÃOS</Souto> {/*Sugiro criar um png com fundo transparente com o texto e imagem dessa parte */}
			<Atendimento />
			<Souto>
				Serviço de ambulância particular para atendimentos, remoções, altas e exames emergenciais.
			</Souto>
			<Aberto />
			<Souto>
				<Souto>ESPECIALIDADES</Souto>
				<Souto>Remoção, Transporte e Atendimento médico</Souto>
			</Souto>
			<Souto>
				<Souto>A FROTA</Souto>
				<Souto>Nossa frota grante eficiência para qualquer tipo de emergência</Souto>
			</Souto>
			<Souto>
				<Souto>CREDEINCIAMENTO</Souto>
				<Souto>Oferecemos toda a segurança de um profissionalismo credenciado</Souto>
			</Souto>
			<Souto>
				<Souto>A EQUIPE</Souto>
				<Souto>Infraestrutura sob comando de profissionais qualificados</Souto>
			</Souto>
			<Souto>Serviços que oferecemos</Souto>
			{/* carrossel */}
		</main>
	)
}