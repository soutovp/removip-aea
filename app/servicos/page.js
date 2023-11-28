import Atendimento from '../components/Atendimento'
import Banner from '../components/Banner'
import Aberto from '../components/Aberto'
import servicosStyle from '../styles/pages/servicos/page.module.sass'
import servicos from './servicos.json'
export const metadata = {
	title: 'Removip - Serviços',
	description: 'Possuimos alguns serviços como: Transporte Aeromédico, Remoção de Pacientes, Cobertura médica de eventos, Postos Médicos e Lacação de Ambulâncias.'
}
export default function Page() {
	return (
		<>
			<Banner img={'cama'} alt={'Imagem de maca sendo removida de uma ambulância.'} />
			<Atendimento className={servicosStyle.atendimento} />
			<section className={servicosStyle.servicos}>
				<h1>Conheça algumas de nossas soluções</h1>
				<div>
					{servicos.map(({ imagem, title, text }, index) => (
						<article key={index}>
							<img src={`/images/${imagem.img}.jpg`} alt={imagem.alt} />
							<h2>{title}</h2>
							<div>
								{text.map((paragrafo, index) => (
									<p key={index}>{paragrafo}</p>
								))}
							</div>
						</article>
					))}
				</div>
			</section>
			<Aberto className={servicosStyle.aberto} />
		</>
	)
}