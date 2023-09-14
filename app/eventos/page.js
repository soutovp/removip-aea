import Banner from "../components/Banner"
import Atendimento from "../components/Atendimento"
import pageEventos from '../styles/pages/eventos/page.module.sass'
import Carrossel from "../components/Carrossel"
import Formulario from "../components/Formulario"
import Aberto from "../components/Aberto"
export default function Eventos() {
	return (
		<>
			<Banner alt={'Background de ambulancias'} img={'bg-ambulancias'} />
			<Atendimento className={pageEventos.atendimento} />
			<section className={pageEventos.mainSection}>
				<h2><strong>Contrate agora mesmo</strong> cobertura médica para seu evento</h2>
				<a href="https://whatsa.me/5521970769075/?t=Ol%C3%A1" target="_blank">
					<button tabIndex={-1}><strong>PEÇA AGORA</strong> VIA WHATSAPP</button>
				</a>
				<article className={pageEventos.articleFirst}>
					<p>Nós temos uma estrutura completa de ambulâncias e profissionais especializados na área da saúde para você realizar os seus eventos com tranquilidade e segurança. Cobertura médica e infraestrutura completa para qualquer evento, seja ele: esportivo, social, cultural, religioso ou corporativo.</p>
				</article>
				<a href="tel:+5521970769075">
					<button tabIndex={-1}><strong>PEÇA AGORA</strong> POR TELEFONE</button>
				</a>
				<section className={pageEventos.sectionInside}>
					<img src="#" alt="Tem uma imagem aqui" />
					<article>
						<p>Somos homologados pela <strong>ANVISA</strong> - <span>Agência Nacional de Vigilãncia Sanitária</span> - e nosso quadro de colaboreadores inclui médicos, enfermeiros e farmacêuticos especialista em suas respectivas áreas. Nosso foco é atender a todos os clientes de forma ágil, acolhedora e humanizada.</p>
						<p>Quando se trata se salvar vidas o profissionalismo sempre está em priomeiro lugar.</p>
					</article>
				</section>
				<section className={pageEventos.carrossel}>
					<Carrossel />
					<Formulario className={pageEventos.formulario} />
				</section>
			</section>
			<Aberto className={pageEventos.aberto} />
		</>
	)
}