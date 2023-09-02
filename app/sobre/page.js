import Banner from '../components/Banner'
import Aberto from '../components/Aberto'
// import '../styles/_sobre.sass'
import pageSobre from '../styles/pages/sobre/page.module.sass'
import Head from 'next/head'
import Atendimento from '../components/Atendimento'
// import atendimento from '../styles/pages/sobre/atendimento.module.sass'
export const metadata = {
	title: 'Removip - Sobre'
}
export default function Page() {
	return (
		<>
			<Head>
				<title>Removip - Sobre</title>
			</Head>
			<main>
				<Banner alt={'Background de ambulancias'} img={'bg-ambulancias2'} className={pageSobre.sessaoBanner} />
				<Atendimento className={pageSobre.atendimento} />
				<section className='sobre'>
					<div className='sobre-first-article'>
						<article>
							<header>
								<h2>Sobre</h2>
							</header>
							<p>Removip é uma empresa especializada em locação de ambulâncias, remoção de pacientes e cobertura médica de eventos. Nossa frota de ambulâncias é totalmente equipada com o que há de mais moderno e funcional para atendimento em unidades móveis e nossa equipe é formada por profissionais com extensa experiência e profundo treinamento nesse mercado. Nossa empresa, assim como toda nossa frota, é homologada pela ANVISA = Agência Nacional de Vigilância Sanitária e nosso quadro de colaboradores inclui médicos, enfermeiros e farmacêuticos resposáveis técnicos por suas respectivas áreas.</p>
						</article>
						<div className='sobre-divider'></div>
						<div className='sobre-articles'>
							<article>
								<header>
									<h2>Visão</h2>
								</header>
								<p>Atender nossos clientes sempre de forma eficiente, ágil, acolhedora, solidária e humanizada. Quando se trata de salvar vidas, o profissionalismo deve estar sempre em 1º lugar.</p>
							</article>
							<article>
								<header>
									<h2>Valores</h2>
								</header>
								<p>Atender e servir com respeito, empatia e excelência, em rpol do bem maior que é a vida humana.</p>
							</article>
							<article>
								<header>
									<h2>Missão</h2>
								</header>
								<p>Prover um atendimento de excelência, num ramo de atividade no qual os clientes frequentemente encontram-se sensíveis devido à prórpia natureza do serviço contratado</p>
							</article>
						</div>
					</div>
				</section>
				{/* vídeo */}
				<Aberto />
			</main>
		</>
	)
}