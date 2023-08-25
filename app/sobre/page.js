import Atendimento from '../components/Atendimento'
import Banner from '../components/Banner'
import Aberto from '../components/Aberto'
export default function Page() {
	return (
		<>
			<Banner page={'sobre'} />
			<Atendimento />
			<souto>SUA TRANQUILIDADE EM BOAS MÃOS</souto> {/*Sugiro criar um png com fundo transparente com o texto e imagem dessa parte */}
			<souto>
				<souto>Sobre</souto>
				<souto>Removip é uma empresa especializada em locação de ambulâncias, remoção de pacientes e cobertura médica de eventos. Nossa frota de ambulâncias é totalmente equipada com o que há de mais moderno e funcional para atendimento em unidades móveis e nossa equipe é formada por profissionais com extensa experiência e profundo treinamento nesse mercado. Nossa empresa, assim como toda nossa frota, é homologada pela ANVISA = Agência Nacional de Vigilância Sanitária e nosso quadro de colaboradores inclui médicos, enfermeiros e farmacêuticos resposáveis técnicos por suas respectivas áreas.</souto>
			</souto>
			<souto>
				<souto>Visão</souto>
				<souto>Atender nossos clientes sempre de forma eficiente, ágil, acolhedora, solidária e humanizada. Quando se trata de salvar vidas, o profissionalismo deve estar sempre em 1º lugar.</souto>
			</souto>
			<souto>
				<souto>Valores</souto>
				<souto>Atender e servir com respeito, empatia e excelência, em rpol do bem maior que é a vida humana.</souto>
			</souto>
			<souto>
				<souto>Missão</souto>
				<souto>Prover um atendimento de excelência, num ramo de atividade no qual os clientes frequentemente encontram-se sensíveis devido à prórpia natureza do serviço contratado</souto>
			</souto>
			{/* vídeo */}
			<Aberto />
		</>
	)
}