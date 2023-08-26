import Atendimento from '../components/Atendimento'
import Banner from '../components/Banner'
import Aberto from '../components/Aberto'
import Souto from '../components/Souto'
export default function Page() {
	return (
		<>
			<Banner page={'sobre'} />
			<Atendimento />
			<Souto>SUA TRANQUILIDADE EM BOAS MÃOS</Souto> {/*Sugiro criar um png com fundo transparente com o texto e imagem dessa parte */}
			<Souto>
				<Souto>Sobre</Souto>
				<Souto>Removip é uma empresa especializada em locação de ambulâncias, remoção de pacientes e cobertura médica de eventos. Nossa frota de ambulâncias é totalmente equipada com o que há de mais moderno e funcional para atendimento em unidades móveis e nossa equipe é formada por profissionais com extensa experiência e profundo treinamento nesse mercado. Nossa empresa, assim como toda nossa frota, é homologada pela ANVISA = Agência Nacional de Vigilância Sanitária e nosso quadro de colaboradores inclui médicos, enfermeiros e farmacêuticos resposáveis técnicos por suas respectivas áreas.</Souto>
			</Souto>
			<Souto>
				<Souto>Visão</Souto>
				<Souto>Atender nossos clientes sempre de forma eficiente, ágil, acolhedora, solidária e humanizada. Quando se trata de salvar vidas, o profissionalismo deve estar sempre em 1º lugar.</Souto>
			</Souto>
			<Souto>
				<Souto>Valores</Souto>
				<Souto>Atender e servir com respeito, empatia e excelência, em rpol do bem maior que é a vida humana.</Souto>
			</Souto>
			<Souto>
				<Souto>Missão</Souto>
				<Souto>Prover um atendimento de excelência, num ramo de atividade no qual os clientes frequentemente encontram-se sensíveis devido à prórpia natureza do serviço contratado</Souto>
			</Souto>
			{/* vídeo */}
			<Aberto />
		</>
	)
}