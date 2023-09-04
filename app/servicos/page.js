import Atendimento from '../components/Atendimento'
import Banner from '../components/Banner'
import Aberto from '../components/Aberto'
import servicosStyle from '../styles/pages/servicos/page.module.sass'
export const metadata = {
	title: 'Removip - Serviços'
}
export default function Page() {
	const servicos = [
		{
			imagem: { img: 'servico_resgate-aeromedico', alt: 'Imagem de um helicoptero.' },
			title: 'Transporte Aeromédico',
			text: (<><p>Sistema de transporte aéro integrado com o terrestre.</p><p>Transferência intermunicipal, interestadual e internacional.</p></>)
		},
		{
			imagem: { img: 'servico_remocao-ambulancia-particular', alt: 'Imagem de uma paramédica atrás de uma ambulância.' },
			title: 'Remoção de Pacientes',
			text: (<>
				<p>Residência -&gt; Hospital</p>
				<span>(internação/exame)</span>
				<p>Hospital -&gt; Residência</p>
				<span>(Alta hospitalar)</span>
				<p>Residência -&gt; Clínica/consultório -&gt; Residência</p>
				<span>(Exame)</span>
			</>)
		},
		{
			imagem: { img: 'servico_ambulancia-cobertura-medica', alt: 'Imagem de uma ambulância com três paramédicos na frente dela.' },
			title: 'Cobertura médica de eventos',
			text: (<><p>Cobertura médica e infraestrutura completa para qualquer evento, seja ele: esportivo, social, cultural, religioso ou corporativo.</p></>)
		},
		{
			imagem: { img: 'servico_posto-medico-evento', alt: 'Imagem de uma sala de atendimento clínico.' },
			title: 'Postos Médicos',
			text: (<><p>Implantação e gestão de ambulatórios lacais. Segurança garantida onde for preciso</p></>)
		},
		{
			imagem: { img: 'servico_locacao-aluguel-ambulancia', alt: 'Imagem de duas ambulâncias estacionadas.' },
			title: 'Locação de Ambulâncias',
			text: (<>
				<p>Moderna frotas de ambulâncias.</p>
				<p>Flexibilidade do período contratado.</p>
			</>)
		}
	]
	return (
		<>
			<Banner img={'cama'} alt={'Imagem de maca sendo removida de uma ambulância.'} />
			<Atendimento className={servicosStyle.atendimento} />
			<section className={servicosStyle.servicos}>
				<h1>Conheça algumas de nossas soluções</h1>
				<div>
					{servicos.map(servico => {
						return (<>
							<article>
								<img src={`/images/${servico.imagem.img}.png`} alt={servico.imagem.alt} />
								<h2>{servico.title}</h2>
								{servico.text}
							</article>
						</>)
					})}
				</div>
			</section>
			<Aberto className={servicosStyle.aberto} />
		</>
	)
}