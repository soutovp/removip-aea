import Atendimento from '../components/Atendimento'
import Banner from '../components/Banner'
import Aberto from '../components/Aberto'
import servicosStyle from '../styles/pages/servicos/page.module.sass'
import servicos from './servicos.json'

export default function Page() {

	return (
		<>
			<Banner img={'cama'} alt={'Imagem de maca sendo removida de uma ambulância.'} />
			<Atendimento className={servicosStyle.atendimento} />
			<section className={servicosStyle.servicos}>
				<h1>Conheça algumas de nossas soluções</h1>
				<div>
					{servicos.map((servico) => (
						<article key={servico.title}>
							<img src={`/images/${servico.imagem.img}.png`} alt={servico.imagem.alt} />
							<h2>{servico.title}</h2>
							<div dangerouslySetInnerHTML={{ __html: servico.text }} />
						</article>
					))}
				</div>
			</section>
			<Aberto className={servicosStyle.aberto} />
		</>
	)
}